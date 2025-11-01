import { useEffect, useState, useRef, useCallback } from 'react';
import { getWebSocketService, WebSocketService } from '../services/websocket.service';
import type { ConnectionState, EventHandler } from '../services/websocket.service';

export interface UseWebSocketOptions {
  url: string;
  token: string | null;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  on: <T = unknown>(event: string, handler: EventHandler<T>) => void;
  off: <T = unknown>(event: string, handler: EventHandler<T>) => void;
  emit: (event: string, data?: unknown) => void;
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
}

/**
 * React hook for WebSocket integration
 * Manages connection lifecycle, event subscriptions, and cleanup
 *
 * @example
 * ```tsx
 * const { isConnected, on, emit, joinBoard } = useWebSocket({
 *   url: 'http://localhost:3000',
 *   token: authToken,
 * });
 *
 * useEffect(() => {
 *   const cleanup = on('card:created', (data) => {
 *     console.log('Card created:', data);
 *   });
 *   return cleanup;
 * }, [on]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, token, autoConnect = true, onConnect, onDisconnect, onError } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const serviceRef = useRef<WebSocketService | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const isInitializedRef = useRef(false);

  // Initialize service
  useEffect(() => {
    if (!isInitializedRef.current) {
      serviceRef.current = getWebSocketService({
        url,
        autoConnect: false, // We'll manage connection manually
      });
      isInitializedRef.current = true;
    }
  }, [url]);

  // Handle connection state changes
  useEffect(() => {
    if (!serviceRef.current) {
      return;
    }

    const cleanup = serviceRef.current.onConnectionStateChange((state) => {
      setConnectionState(state);

      if (state === 'connected' && onConnect) {
        onConnect();
      } else if (state === 'disconnected' && onDisconnect) {
        onDisconnect();
      }
    });

    return cleanup;
  }, [onConnect, onDisconnect]);

  // Auto-connect when token is available
  useEffect(() => {
    if (!serviceRef.current || !token || !autoConnect) {
      return;
    }

    serviceRef.current.connect(token);

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [token, autoConnect]);

  // Connect function
  const connect = useCallback(() => {
    if (!serviceRef.current || !token) {
      const error = new Error('Cannot connect: missing token or service not initialized');
      console.error(error);
      if (onError) {
        onError(error);
      }
      return;
    }

    serviceRef.current.connect(token);
  }, [token, onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);

  // Register event handler
  const on = useCallback(<T = unknown>(event: string, handler: EventHandler<T>) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot register handler - service not initialized');
      return;
    }

    // Track handlers for cleanup
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler as EventHandler);

    // Register with service
    serviceRef.current.on(event, handler);
  }, []);

  // Unregister event handler
  const off = useCallback(<T = unknown>(event: string, handler: EventHandler<T>) => {
    if (!serviceRef.current) {
      return;
    }

    // Remove from tracking
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(event);
      }
    }

    // Unregister from service
    serviceRef.current.off(event, handler);
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: unknown) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot emit - service not initialized');
      return;
    }

    serviceRef.current.emit(event, data);
  }, []);

  // Join board room
  const joinBoard = useCallback((boardId: string) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot join board - service not initialized');
      return;
    }

    serviceRef.current.joinBoard(boardId);
  }, []);

  // Leave board room
  const leaveBoard = useCallback((boardId: string) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot leave board - service not initialized');
      return;
    }

    serviceRef.current.leaveBoard(boardId);
  }, []);

  // Cleanup all event handlers on unmount
  useEffect(() => {
    const eventHandlers = eventHandlersRef.current;
    const service = serviceRef.current;

    return () => {
      if (!service) {
        return;
      }

      // Unregister all tracked handlers
      eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          service?.off(event, handler);
        });
      });

      eventHandlers.clear();
    };
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    on,
    off,
    emit,
    joinBoard,
    leaveBoard,
  };
}
