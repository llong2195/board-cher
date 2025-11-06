// useRealtimeBoardUpdates - Subscribe to real-time board events
// Based on contracts/websocket-events.md

import { useEffect, useCallback } from 'react';
import { webSocketService } from '@/services/websocket/WebSocketService';
import { useWebSocket } from './useWebSocket';
import type {
  BoardUpdatedEvent,
  BoardMemberJoinedEvent,
  BoardMemberLeftEvent,
  ListCreatedEvent,
  ListUpdatedEvent,
  ListDeletedEvent,
  ListsReorderedEvent,
  CardCreatedEvent,
  CardUpdatedEvent,
  CardMovedEvent,
  CardDeletedEvent,
} from '@/types/websocket.types';

export interface UseRealtimeBoardUpdatesOptions {
  boardId: string;
  currentUserId?: string;
  onBoardUpdated?: (event: BoardUpdatedEvent) => void;
  onMemberJoined?: (event: BoardMemberJoinedEvent) => void;
  onMemberLeft?: (event: BoardMemberLeftEvent) => void;
  onListCreated?: (event: ListCreatedEvent) => void;
  onListUpdated?: (event: ListUpdatedEvent) => void;
  onListDeleted?: (event: ListDeletedEvent) => void;
  onListsReordered?: (event: ListsReorderedEvent) => void;
  onCardCreated?: (event: CardCreatedEvent) => void;
  onCardUpdated?: (event: CardUpdatedEvent) => void;
  onCardMoved?: (event: CardMovedEvent) => void;
  onCardDeleted?: (event: CardDeletedEvent) => void;
  onReconnect?: () => void;
}

export function useRealtimeBoardUpdates(options: UseRealtimeBoardUpdatesOptions): void {
  const { boardId, currentUserId } = options;
  const { isConnected, joinBoard, leaveBoard } = useWebSocket();

  // Deduplication helper - skip events from current user
  const shouldProcessEvent = useCallback(
    (updatedBy?: { userId: string }) => {
      if (!updatedBy || !currentUserId) return true;
      return updatedBy.userId !== currentUserId;
    },
    [currentUserId],
  );

  // Join board room when connected
  useEffect(() => {
    if (!isConnected || !boardId) return;

    joinBoard(boardId);

    return () => {
      leaveBoard(boardId);
    };
  }, [isConnected, boardId, joinBoard, leaveBoard]);

  // Subscribe to board events
  useEffect(() => {
    if (!isConnected) return;

    // Board events
    const handleBoardUpdated = (event: BoardUpdatedEvent) => {
      if (shouldProcessEvent(event.updatedBy)) {
        options.onBoardUpdated?.(event);
      }
    };
    const handleMemberJoined = (event: BoardMemberJoinedEvent) => {
      options.onMemberJoined?.(event);
    };
    const handleMemberLeft = (event: BoardMemberLeftEvent) => {
      options.onMemberLeft?.(event);
    };

    // List events
    const handleListCreated = (event: ListCreatedEvent) => {
      if (shouldProcessEvent(event.createdBy)) {
        options.onListCreated?.(event);
      }
    };
    const handleListUpdated = (event: ListUpdatedEvent) => {
      if (shouldProcessEvent(event.updatedBy)) {
        options.onListUpdated?.(event);
      }
    };
    const handleListDeleted = (event: ListDeletedEvent) => {
      if (shouldProcessEvent(event.deletedBy)) {
        options.onListDeleted?.(event);
      }
    };
    const handleListsReordered = (event: ListsReorderedEvent) => {
      if (shouldProcessEvent(event.reorderedBy)) {
        options.onListsReordered?.(event);
      }
    };

    // Card events
    const handleCardCreated = (event: CardCreatedEvent) => {
      if (shouldProcessEvent(event.createdBy)) {
        options.onCardCreated?.(event);
      }
    };
    const handleCardUpdated = (event: CardUpdatedEvent) => {
      if (shouldProcessEvent(event.updatedBy)) {
        options.onCardUpdated?.(event);
      }
    };
    const handleCardMoved = (event: CardMovedEvent) => {
      if (shouldProcessEvent(event.movedBy)) {
        options.onCardMoved?.(event);
      }
    };
    const handleCardDeleted = (event: CardDeletedEvent) => {
      if (shouldProcessEvent(event.deletedBy)) {
        options.onCardDeleted?.(event);
      }
    };

    // Subscribe to all events
    webSocketService.on<BoardUpdatedEvent>('board:updated', handleBoardUpdated);
    webSocketService.on<BoardMemberJoinedEvent>('board:member:joined', handleMemberJoined);
    webSocketService.on<BoardMemberLeftEvent>('board:member:left', handleMemberLeft);
    webSocketService.on<ListCreatedEvent>('list:created', handleListCreated);
    webSocketService.on<ListUpdatedEvent>('list:updated', handleListUpdated);
    webSocketService.on<ListDeletedEvent>('list:deleted', handleListDeleted);
    webSocketService.on<ListsReorderedEvent>('lists:reordered', handleListsReordered);
    webSocketService.on<CardCreatedEvent>('card:created', handleCardCreated);
    webSocketService.on<CardUpdatedEvent>('card:updated', handleCardUpdated);
    webSocketService.on<CardMovedEvent>('card:moved', handleCardMoved);
    webSocketService.on<CardDeletedEvent>('card:deleted', handleCardDeleted);

    // Cleanup: Unsubscribe from all events
    return () => {
      webSocketService.off('board:updated', handleBoardUpdated as (...args: unknown[]) => void);
      webSocketService.off(
        'board:member:joined',
        handleMemberJoined as (...args: unknown[]) => void,
      );
      webSocketService.off('board:member:left', handleMemberLeft as (...args: unknown[]) => void);
      webSocketService.off('list:created', handleListCreated as (...args: unknown[]) => void);
      webSocketService.off('list:updated', handleListUpdated as (...args: unknown[]) => void);
      webSocketService.off('list:deleted', handleListDeleted as (...args: unknown[]) => void);
      webSocketService.off('lists:reordered', handleListsReordered as (...args: unknown[]) => void);
      webSocketService.off('card:created', handleCardCreated as (...args: unknown[]) => void);
      webSocketService.off('card:updated', handleCardUpdated as (...args: unknown[]) => void);
      webSocketService.off('card:moved', handleCardMoved as (...args: unknown[]) => void);
      webSocketService.off('card:deleted', handleCardDeleted as (...args: unknown[]) => void);
    };
  }, [isConnected, options, shouldProcessEvent]);

  // Handle reconnection - refetch board data
  useEffect(() => {
    if (!isConnected) return;

    const handleReconnect = () => {
      console.log('[Realtime] Reconnected, syncing board data...');
      options.onReconnect?.();
    };

    webSocketService.on('reconnect', handleReconnect);

    return () => {
      webSocketService.off('reconnect', handleReconnect);
    };
  }, [isConnected, options]);
}
