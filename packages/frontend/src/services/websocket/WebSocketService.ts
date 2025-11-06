// WebSocket Service - Singleton for managing Socket.io connection
// Based on contracts/websocket-events.md

import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type {
  ConnectionStatus,
  JoinBoardPayload,
  LeaveBoardPayload,
  BoardJoinedPayload,
} from '@/types/websocket.types';
import { WebSocketError } from '@/types/error.types';

class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor() {
    // Singleton pattern - prevent direct instantiation
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
      const token = this.getAuthToken();

      this.socket = io(wsUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupConnectionHandlers();
      this.setupErrorHandlers();
      this.setupRoomHandlers();
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      throw new WebSocketError('Failed to connect to server');
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateConnectionStatus('disconnected');
    }
  }

  // Subscribe to an event
  on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.warn('[WebSocket] Cannot subscribe - not connected');
      return;
    }
    this.socket.on(event, callback);
  }

  // Unsubscribe from an event
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Emit an event
  emit<T = unknown>(event: string, data: T): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Subscribe to connection status changes
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Return cleanup function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  // Join a board room
  joinBoard(boardId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot join board - not connected');
      return;
    }
    this.emit<JoinBoardPayload>('board:join', { boardId });
  }

  // Leave a board room
  leaveBoard(boardId: string): void {
    if (!this.socket?.connected) return;
    this.emit<LeaveBoardPayload>('board:leave', { boardId });
  }

  // Setup connection event handlers
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateConnectionStatus('disconnected');
    });

    this.socket.on('reconnecting', (attempt: number) => {
      console.log(`[WebSocket] Reconnecting... attempt ${attempt}`);
      this.reconnectAttempts = attempt;
      this.updateConnectionStatus('reconnecting');
    });

    this.socket.on('reconnect', (attempt: number) => {
      console.log(`[WebSocket] Reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
    });
  }

  // Setup error event handlers
  private setupErrorHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);

      // Authentication error
      if (error.message.includes('auth')) {
        console.error('[WebSocket] Authentication failed');
        // Note: Toast notification will be handled by useWebSocket hook
      }

      // Max reconnect attempts reached
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.updateConnectionStatus('disconnected');
      }
    });

    this.socket.on('error', ({ message, code }: { message: string; code: string }) => {
      console.error('[WebSocket] Server error:', code, message);
      // Note: Toast notification will be handled by useWebSocket hook
    });
  }

  // Setup room management handlers
  private setupRoomHandlers(): void {
    if (!this.socket) return;

    this.socket.on('board:joined', (data: BoardJoinedPayload) => {
      console.log(`[WebSocket] Joined board ${data.boardId} with ${data.activeUsers.length} users`);
    });
  }

  // Update connection status and notify listeners
  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  // Get authentication token
  private getAuthToken(): string | null {
    // TODO: Implement proper auth token management
    return localStorage.getItem('auth_token');
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
