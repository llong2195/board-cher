import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WS_EVENTS } from '@trello-vibe/shared';
import {
  type BoardJoinEvent,
  type BoardJoinResponse,
  type BoardLeaveEvent,
  type BoardUserJoinedEvent,
  type BoardUserLeftEvent,
  type EventActor,
} from '@trello-vibe/shared';
import { Server, Socket } from 'socket.io';

type AuthenticatedSocket = Omit<Socket, 'data'> & {
  data: ClientData;
};

interface ClientData {
  userId: string;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class BoardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() private readonly server!: Server;

  private readonly logger = new Logger(BoardGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private readonly socketRooms = new Map<string, Set<string>>(); // socketId -> Set<boardId>
  private readonly roomMembers = new Map<string, Set<string>>(); // boardId -> Set<userId>

  constructor(private readonly jwtService: JwtService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token from handshake
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.emit(WS_EVENTS.CONNECT_ERROR, {
          message: 'Authentication token required',
        });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.emit(WS_EVENTS.CONNECT_ERROR, {
          message: 'Authentication failed',
        });
        client.disconnect();
        return;
      }

      // Store user info in socket data
      const clientData: ClientData = {
        userId: payload.sub,
        email: payload.email,
      };
      client.data = clientData;
      // Track user socket
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      // Initialize socket rooms tracking
      this.socketRooms.set(client.id, new Set());

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.sub}, email: ${payload.email})`,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Connection error: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Connection error: `, error);
      }

      client.emit(WS_EVENTS.CONNECT_ERROR, {
        message: 'Authentication error',
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.userId;
    const socketId = client.id;

    // Leave all rooms
    const rooms = this.socketRooms.get(socketId) || new Set();
    for (const boardId of rooms) {
      await this.leaveRoom(client, boardId);
    }

    // Remove socket from user tracking
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socketId);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Clean up socket rooms tracking
    this.socketRooms.delete(socketId);

    this.logger.log(
      `Client disconnected: ${socketId} (user: ${userId || 'unknown'})`,
    );
  }

  @SubscribeMessage(WS_EVENTS.PING)
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): {
    message: string;
  } {
    console.log('🚀 ~ BoardGateway ~ handlePing ~ client:', client.id);
    return { message: 'pong' };
  }

  @SubscribeMessage(WS_EVENTS.BOARD_JOIN)
  async handleBoardJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: BoardJoinEvent,
  ): Promise<BoardJoinResponse> {
    try {
      const { boardId } = data;
      const userId = client.data.userId;

      if (!boardId) {
        return {
          success: false,
          error: 'Board ID is required',
        };
      }

      // Check if user already in this board room
      const currentRooms = this.socketRooms.get(client.id) || new Set();
      if (currentRooms.has(boardId)) {
        return {
          success: false,
          error: 'Already joined this board',
        };
      }

      // TODO: Add permission check here
      // For now, allow all authenticated users

      // Join the board room
      await client.join(boardId);
      currentRooms.add(boardId);
      this.socketRooms.set(client.id, currentRooms);

      // Track room membership
      if (!this.roomMembers.has(boardId)) {
        this.roomMembers.set(boardId, new Set());
      }
      this.roomMembers.get(boardId)!.add(userId);

      // Get active members list
      const activeMembers = Array.from(this.roomMembers.get(boardId) || []);

      this.logger.log(`User ${userId} joined board ${boardId}`);

      // Notify other users in the room
      const joinEvent: BoardUserJoinedEvent = {
        boardId,
        userId,
        timestamp: Date.now(),
        actor: this.getActor(client),
      };
      client.to(boardId).emit(WS_EVENTS.BOARD_USER_JOINED, joinEvent);

      return {
        success: true,
        boardId,
        activeMembers,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Board join error: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Board join error: `, error);
      }

      return {
        success: false,
        error: 'Failed to join board',
      };
    }
  }

  @SubscribeMessage(WS_EVENTS.BOARD_LEAVE)
  async handleBoardLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: BoardLeaveEvent,
  ): Promise<{ success: boolean }> {
    try {
      const { boardId } = data;
      await this.leaveRoom(client, boardId);

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Board leave error: ${error?.message}`, error?.stack);
      } else {
        this.logger.error(`Board leave error: `, error);
      }
      return { success: false }; // Ensure a return value in case of an error
    }
  }

  // Helper method to leave a room
  private async leaveRoom(client: AuthenticatedSocket, boardId: string) {
    const userId = client.data.userId;
    const socketId = client.id;

    // Leave the socket.io room
    await client.leave(boardId);

    // Update tracking
    const rooms = this.socketRooms.get(socketId);
    if (rooms) {
      rooms.delete(boardId);
    }

    // Remove from room members if no other sockets from this user are in the room
    const userSocketsInRoom = Array.from(
      this.userSockets.get(userId) || [],
    ).filter((sid) => {
      const socketRoomSet = this.socketRooms.get(sid);
      return socketRoomSet && socketRoomSet.has(boardId);
    });

    if (userSocketsInRoom.length === 0) {
      const members = this.roomMembers.get(boardId);
      if (members) {
        members.delete(userId);
        if (members.size === 0) {
          this.roomMembers.delete(boardId);
        }
      }

      this.logger.log(`User ${userId} left board ${boardId}`);

      // Notify other users
      const leaveEvent: BoardUserLeftEvent = {
        boardId,
        userId,
        timestamp: Date.now(),
        actor: this.getActor(client),
      };
      client.to(boardId).emit(WS_EVENTS.BOARD_USER_LEFT, leaveEvent);
    }
  }

  // Helper to extract token from socket handshake
  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth;
    if (auth && auth.token && typeof auth.token === 'string') {
      // Remove "Bearer " prefix if present
      return auth.token.replace(/^Bearer\s+/i, '');
    }
    return null;
  }

  // Helper to verify JWT token
  private async verifyToken(
    token: string,
  ): Promise<{ sub: string; email: string } | null> {
    try {
      const payload: { sub: string; email: string } =
        await this.jwtService.verifyAsync(token);
      return payload as { sub: string; email: string };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.warn(`Token verification failed: ${error.message}`);
      } else {
        this.logger.error(`Token verification failed: `, error);
      }

      return null;
    }
  }

  // Helper to get actor info from socket
  private getActor(client: AuthenticatedSocket): EventActor {
    return {
      userId: client.data.userId,
      email: client.data.email,
    };
  }

  // Public method for broadcasting events to a board
  public broadcastToBoard(
    boardId: string,
    event: string,
    data: any,
    excludeSocketId?: string,
  ) {
    if (excludeSocketId) {
      this.server.to(boardId).except(excludeSocketId).emit(event, data);
    } else {
      this.server.to(boardId).emit(event, data);
    }
  }
}
