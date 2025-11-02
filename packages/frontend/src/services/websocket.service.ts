import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@trello-vibe/shared';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type EventHandler<T = unknown> = (data: T) => void;

export interface WebSocketServiceConfig {
  url: string;
  path?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

/**
 * WebSocket client service for real-time communication with the backend
 * Provides auto-reconnection, event handler registration, and connection state management
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  private config: Required<WebSocketServiceConfig>;

  constructor(config: WebSocketServiceConfig) {
    this.config = {
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      ...config,
    };
  }

  /**
   * Initialize the WebSocket connection
   * @param token - JWT token for authentication
   */
  connect(token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    this.setConnectionState('connecting');

    this.socket = io(this.config.url, {
      path: this.config.path,
      auth: { token },
      autoConnect: this.config.autoConnect,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      timeout: this.config.timeout,
    });

    this.setupDefaultHandlers();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState('disconnected');
    }
  }

  /**
   * Register an event handler for a specific event
   * @param event - The event name to listen for
   * @param handler - The callback function to invoke when the event is received
   * @returns A cleanup function to unregister the handler
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler as EventHandler);

    // Register with socket if connected
    if (this.socket) {
      this.socket.on(event, handler);
    }

    // Return cleanup function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unregister an event handler
   * @param event - The event name
   * @param handler - The handler function to remove
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Emit an event to the server
   * @param event - The event name
   * @param data - The data to send
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket) {
      console.warn('[WebSocketService] Cannot emit - not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Join a board room to receive real-time updates
   * @param boardId - The board ID to join
   */
  joinBoard(boardId: string): void {
    this.emit(WS_EVENTS.BOARD_JOIN, { boardId });
  }

  /**
   * Leave a board room
   * @param boardId - The board ID to leave
   */
  leaveBoard(boardId: string): void {
    this.emit(WS_EVENTS.BOARD_LEAVE, { boardId });
  }

  /**
   * Subscribe to connection state changes
   * @param listener - Callback invoked when connection state changes
   * @returns A cleanup function to unsubscribe
   */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener);

    // Call immediately with current state
    listener(this.connectionState);

    // Return cleanup function
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Setup default connection/disconnection handlers
   */
  private setupDefaultHandlers(): void {
    if (!this.socket) {
      return;
    }

    // Connection established
    this.socket.on(WS_EVENTS.CONNECT, () => {
      console.log('[WebSocketService] Connected');
      this.setConnectionState('connected');

      // Re-register all event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket?.on(event, handler);
        });
      });
    });

    // Connection lost
    this.socket.on(WS_EVENTS.DISCONNECT, (reason: string) => {
      console.log(`[WebSocketService] Disconnected: ${reason}`);
      this.setConnectionState('disconnected');
    });

    // Connection error
    this.socket.on(WS_EVENTS.AUTH_ERROR, (error: Error) => {
      console.error('[WebSocketService] Connection error:', error);
      this.setConnectionState('disconnected');
    });

    // Reconnecting
    this.socket.io.on('reconnect_attempt', () => {
      console.log('[WebSocketService] Attempting to reconnect...');
      this.setConnectionState('reconnecting');
    });

    // Reconnection successful
    this.socket.io.on('reconnect', (attemptNumber: number) => {
      console.log(`[WebSocketService] Reconnected after ${attemptNumber} attempts`);
      this.setConnectionState('connected');
    });

    // Reconnection failed
    this.socket.io.on('reconnect_failed', () => {
      console.error('[WebSocketService] Reconnection failed');
      this.setConnectionState('disconnected');
    });
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionStateListeners.forEach((listener) => {
        listener(state);
      });
    }
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

/**
 * Get the singleton WebSocket service instance
 * @param config - Configuration (only used on first call)
 */
export function getWebSocketService(config?: WebSocketServiceConfig): WebSocketService {
  if (!webSocketServiceInstance && config) {
    webSocketServiceInstance = new WebSocketService(config);
  }

  if (!webSocketServiceInstance) {
    throw new Error(
      'WebSocketService not initialized. Call getWebSocketService with config first.',
    );
  }

  return webSocketServiceInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetWebSocketService(): void {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance = null;
  }
}
