import { useEffect, useCallback, useRef } from 'react';
import { WS_EVENTS } from '@trello-vibe/shared';
import { useWebSocket } from './useWebSocket';
import type { EventHandler } from '../services/websocket.service';

export interface Board {
  id: string;
  title: string;
  description?: string;
  // Add other board properties as needed
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  // Add other list properties as needed
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  // Add other card properties as needed
}

export interface UseBoardRealtimeOptions {
  boardId: string | null;
  onBoardUpdate?: (board: Partial<Board>) => void;
  onListCreated?: (list: List) => void;
  onListUpdated?: (list: Partial<List>) => void;
  onListMoved?: (data: { listId: string; position: number }) => void;
  onListDeleted?: (listId: string) => void;
  onCardCreated?: (card: Card) => void;
  onCardUpdated?: (card: Partial<Card>) => void;
  onCardMoved?: (data: { cardId: string; listId: string; position: number }) => void;
  onCardDeleted?: (cardId: string) => void;
  onUserJoined?: (user: { id: string; name: string }) => void;
  onUserLeft?: (userId: string) => void;
}

/**
 * React hook for board-specific real-time updates
 * Automatically joins/leaves board rooms and handles board-related events
 *
 * @example
 * ```tsx
 * const { isConnected } = useBoardRealtime({
 *   boardId: currentBoard?.id,
 *   onCardCreated: (card) => {
 *     setCards((prev) => [...prev, card]);
 *   },
 *   onCardMoved: ({ cardId, listId, position }) => {
 *     setCards((prev) => prev.map((c) =>
 *       c.id === cardId ? { ...c, listId, position } : c
 *     ));
 *   },
 * });
 * ```
 */
export function useBoardRealtime(
  websocketOptions: Parameters<typeof useWebSocket>[0],
  options: UseBoardRealtimeOptions,
) {
  const {
    boardId,
    onBoardUpdate,
    onListCreated,
    onListUpdated,
    onListMoved,
    onListDeleted,
    onCardCreated,
    onCardUpdated,
    onCardMoved,
    onCardDeleted,
    onUserJoined,
    onUserLeft,
  } = options;

  const ws = useWebSocket(websocketOptions);
  const currentBoardIdRef = useRef<string | null>(null);

  // Join/leave board room when boardId changes
  useEffect(() => {
    if (!ws.isConnected || !boardId) {
      return;
    }

    // Leave previous board if needed
    if (currentBoardIdRef.current && currentBoardIdRef.current !== boardId) {
      ws.leaveBoard(currentBoardIdRef.current);
    }

    // Join new board
    if (boardId) {
      ws.joinBoard(boardId);
      currentBoardIdRef.current = boardId;
    }

    // Cleanup: leave board on unmount
    return () => {
      if (currentBoardIdRef.current) {
        ws.leaveBoard(currentBoardIdRef.current);
        currentBoardIdRef.current = null;
      }
    };
  }, [ws, boardId, ws.isConnected]);

  // Helper function to register an event handler
  const registerEventHandler = useCallback(
    <T>(event: string, callback: ((data: T) => void) | undefined, cleanups: (() => void)[]) => {
      if (!callback) return;

      const handler: EventHandler<T> = (data) => callback(data);
      ws.on(event, handler);
      cleanups.push(() => ws.off(event, handler));
    },
    [ws],
  );

  // Setup event handlers
  useEffect(() => {
    if (!boardId) {
      return;
    }

    const cleanupFunctions: (() => void)[] = [];

    // Board events
    registerEventHandler<{ board: Partial<Board> }>(
      WS_EVENTS.BOARD_UPDATED,
      onBoardUpdate ? ({ board }) => onBoardUpdate(board) : undefined,
      cleanupFunctions,
    );

    // List events
    registerEventHandler<{ list: List }>(
      WS_EVENTS.LIST_CREATED,
      onListCreated ? ({ list }) => onListCreated(list) : undefined,
      cleanupFunctions,
    );

    registerEventHandler<{ list: Partial<List> }>(
      WS_EVENTS.LIST_UPDATED,
      onListUpdated ? ({ list }) => onListUpdated(list) : undefined,
      cleanupFunctions,
    );

    registerEventHandler<{ listId: string; position: number }>(
      WS_EVENTS.LIST_MOVED,
      onListMoved,
      cleanupFunctions,
    );

    registerEventHandler<{ listId: string }>(
      WS_EVENTS.LIST_DELETED,
      onListDeleted ? ({ listId }) => onListDeleted(listId) : undefined,
      cleanupFunctions,
    );

    // Card events
    registerEventHandler<{ card: Card }>(
      WS_EVENTS.CARD_CREATED,
      onCardCreated ? ({ card }) => onCardCreated(card) : undefined,
      cleanupFunctions,
    );

    registerEventHandler<{ card: Partial<Card> }>(
      WS_EVENTS.CARD_UPDATED,
      onCardUpdated ? ({ card }) => onCardUpdated(card) : undefined,
      cleanupFunctions,
    );

    registerEventHandler<{ cardId: string; listId: string; position: number }>(
      WS_EVENTS.CARD_MOVED,
      onCardMoved,
      cleanupFunctions,
    );

    registerEventHandler<{ cardId: string }>(
      WS_EVENTS.CARD_DELETED,
      onCardDeleted ? ({ cardId }) => onCardDeleted(cardId) : undefined,
      cleanupFunctions,
    );

    // User presence events
    registerEventHandler<{ user: { id: string; name: string } }>(
      WS_EVENTS.BOARD_USER_JOINED,
      onUserJoined ? ({ user }) => onUserJoined(user) : undefined,
      cleanupFunctions,
    );

    registerEventHandler<{ userId: string }>(
      WS_EVENTS.BOARD_USER_LEFT,
      onUserLeft ? ({ userId }) => onUserLeft(userId) : undefined,
      cleanupFunctions,
    );

    // Cleanup all event handlers
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    registerEventHandler,
    boardId,
    onBoardUpdate,
    onListCreated,
    onListUpdated,
    onListMoved,
    onListDeleted,
    onCardCreated,
    onCardUpdated,
    onCardMoved,
    onCardDeleted,
    onUserJoined,
    onUserLeft,
  ]);

  // Optimistic update helpers
  const createCard = useCallback(
    (card: Omit<Card, 'id'>) => {
      ws.emit(WS_EVENTS.CARD_CREATE, card);
    },
    [ws],
  );

  const updateCard = useCallback(
    (cardId: string, updates: Partial<Card>) => {
      ws.emit(WS_EVENTS.CARD_UPDATE, { cardId, ...updates });
    },
    [ws],
  );

  const moveCard = useCallback(
    (cardId: string, listId: string, position: number) => {
      ws.emit(WS_EVENTS.CARD_MOVE, { cardId, listId, position });
    },
    [ws],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      ws.emit(WS_EVENTS.CARD_DELETE, { cardId });
    },
    [ws],
  );

  const createList = useCallback(
    (list: Omit<List, 'id'>) => {
      ws.emit(WS_EVENTS.LIST_CREATE, list);
    },
    [ws],
  );

  const updateList = useCallback(
    (listId: string, updates: Partial<List>) => {
      ws.emit(WS_EVENTS.LIST_UPDATE, { listId, ...updates });
    },
    [ws],
  );

  const moveList = useCallback(
    (listId: string, position: number) => {
      ws.emit(WS_EVENTS.LIST_MOVE, { listId, position });
    },
    [ws],
  );

  const deleteList = useCallback(
    (listId: string) => {
      ws.emit(WS_EVENTS.LIST_DELETE, { listId });
    },
    [ws],
  );

  return {
    ...ws,
    // Action helpers
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    createList,
    updateList,
    moveList,
    deleteList,
  };
}
