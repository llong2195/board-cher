import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Handles board:leave event
 * Removes user from the board room
 */
@Injectable()
export class BoardLeaveHandler {
  /**
   * Handle user leaving a board room
   * @param client - Socket.io client
   * @param payload - { boardId: string }
   */
  async handle(client: Socket, payload: { boardId: string }): Promise<void> {
    const { boardId } = payload;
    const authClient = client as AuthenticatedSocket;
    const userId = authClient.user?.id;

    if (!userId) {
      return; // Not authenticated, nothing to leave
    }

    // Leave the board room
    await client.leave(`board:${boardId}`);

    // Notify other room members that a user left
    client.to(`board:${boardId}`).emit('board:member:left', {
      boardId,
      userId,
    });

    // Notify client they successfully left
    client.emit('board:left', {
      boardId,
    });
  }
}
