import { Injectable, ForbiddenException } from '@nestjs/common';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Handles board:join event
 * Validates user has permission to access the board and adds them to the room
 */
@Injectable()
export class BoardJoinHandler {
  /**
   * Handle user joining a board room
   * @param client - Socket.io client
   * @param payload - { boardId: string }
   */
  async handle(client: Socket, payload: { boardId: string }): Promise<void> {
    const { boardId } = payload;
    const authClient = client as AuthenticatedSocket;
    const userId = authClient.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // TODO: Check if user has permission to access this board
    // This will be implemented when we add BoardRepository and permission checks
    // For now, allow all authenticated users

    // Join the board room
    await client.join(`board:${boardId}`);

    // Notify client they successfully joined
    client.emit('board:joined', {
      boardId,
      members: await this.getBoardMembers(boardId, client),
    });

    // Notify other room members that a user joined
    client.to(`board:${boardId}`).emit('board:member:joined', {
      boardId,
      userId,
      user: authClient.user,
    });
  }

  /**
   * Get list of connected members in a board room
   */
  private async getBoardMembers(
    boardId: string,
    client: Socket,
  ): Promise<Array<{ id: string; name: string; email: string }>> {
    const sockets = await client.in(`board:${boardId}`).fetchSockets();

    return sockets
      .map((socket) => {
        // RemoteSocket doesn't have user property, but we can access data
        const user = (socket as unknown as AuthenticatedSocket).user;
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; email: string }>;
  }
}
