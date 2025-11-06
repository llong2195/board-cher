// Base useWebSocket hook for connection status and lifecycle
// Based on contracts/websocket-events.md

import { useState, useEffect } from 'react';
import { webSocketService } from '@/services/websocket/WebSocketService';
import type { ConnectionStatus } from '@/types/websocket.types';
import { useToast } from '@/hooks/common/useToast';

export interface UseWebSocketResult {
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
}

export function useWebSocket(): UseWebSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    webSocketService.getConnectionStatus(),
  );
  const toast = useToast();

  useEffect(() => {
    // Connect on mount
    webSocketService.connect();

    // Subscribe to status changes
    const unsubscribe = webSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);

      // Show toast notifications for status changes
      if (newStatus === 'reconnecting') {
        toast.info({
          title: 'Reconnecting...',
          description: 'Attempting to restore connection',
          duration: 0, // Persistent until reconnected
        });
      } else if (newStatus === 'connected') {
        toast.success({
          title: 'Connected',
          description: 'Connection restored',
          duration: 3000,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Note: We don't disconnect here as other components might still need the connection
      // Disconnect happens when the app unmounts or user logs out
    };
  }, [toast]);

  const joinBoard = (boardId: string) => {
    webSocketService.joinBoard(boardId);
  };

  const leaveBoard = (boardId: string) => {
    webSocketService.leaveBoard(boardId);
  };

  return {
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    joinBoard,
    leaveBoard,
  };
}
