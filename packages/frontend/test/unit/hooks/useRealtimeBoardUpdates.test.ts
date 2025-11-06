// Unit tests for useRealtimeBoardUpdates hook
// Tests real-time event subscription and deduplication

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeBoardUpdates } from '@/hooks/websocket/useRealtimeBoardUpdates';
import { webSocketService } from '@/services/websocket/WebSocketService';
import type { BoardUpdatedEvent, ListCreatedEvent, CardMovedEvent } from '@/types/websocket.types';

// Mock dependencies
vi.mock('@/services/websocket/WebSocketService', () => ({
  webSocketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@/hooks/websocket/useWebSocket', () => ({
  useWebSocket: () => ({
    status: 'connected',
    isConnected: true,
    isReconnecting: false,
    joinBoard: vi.fn(),
    leaveBoard: vi.fn(),
  }),
}));

describe('useRealtimeBoardUpdates', () => {
  const mockBoardId = 'board-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should join board on mount when connected', () => {
    const mockJoinBoard = vi.fn();
    vi.mocked(require('@/hooks/websocket/useWebSocket').useWebSocket).mockReturnValue({
      isConnected: true,
      joinBoard: mockJoinBoard,
      leaveBoard: vi.fn(),
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    expect(mockJoinBoard).toHaveBeenCalledWith(mockBoardId);
  });

  it('should leave board on unmount', () => {
    const mockLeaveBoard = vi.fn();
    vi.mocked(require('@/hooks/websocket/useWebSocket').useWebSocket).mockReturnValue({
      isConnected: true,
      joinBoard: vi.fn(),
      leaveBoard: mockLeaveBoard,
    });

    const { unmount } = renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    unmount();

    expect(mockLeaveBoard).toHaveBeenCalledWith(mockBoardId);
  });

  it('should not join board when disconnected', () => {
    const mockJoinBoard = vi.fn();
    vi.mocked(require('@/hooks/websocket/useWebSocket').useWebSocket).mockReturnValue({
      isConnected: false,
      joinBoard: mockJoinBoard,
      leaveBoard: vi.fn(),
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    expect(mockJoinBoard).not.toHaveBeenCalled();
  });

  it('should subscribe to all board events', () => {
    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    // Verify subscriptions to all event types
    expect(webSocketService.on).toHaveBeenCalledWith('board:updated', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('board:member:joined', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('board:member:left', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('list:created', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('list:updated', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('list:deleted', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('lists:reordered', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('card:created', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('card:updated', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('card:moved', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('card:deleted', expect.any(Function));
    expect(webSocketService.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
  });

  it('should call onBoardUpdated callback with event', async () => {
    const onBoardUpdated = vi.fn();
    let capturedHandler: ((event: BoardUpdatedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'board:updated') {
        capturedHandler = handler as (event: BoardUpdatedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        onBoardUpdated,
      }),
    );

    // Simulate board:updated event
    const mockEvent: BoardUpdatedEvent = {
      boardId: mockBoardId,
      board: {
        id: mockBoardId,
        title: 'Updated Board',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      updatedBy: { userId: 'other-user', name: 'Other User' },
      timestamp: new Date(),
    };

    capturedHandler!(mockEvent);

    await waitFor(() => {
      expect(onBoardUpdated).toHaveBeenCalledWith(mockEvent);
    });
  });

  it('should call onListCreated callback with event', async () => {
    const onListCreated = vi.fn();
    let capturedHandler: ((event: ListCreatedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'list:created') {
        capturedHandler = handler as (event: ListCreatedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        onListCreated,
      }),
    );

    const mockEvent: ListCreatedEvent = {
      boardId: mockBoardId,
      list: {
        id: 'list-1',
        title: 'New List',
        position: 0,
        boardId: mockBoardId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdBy: { userId: 'other-user', name: 'Other User' },
      timestamp: new Date(),
    };

    capturedHandler!(mockEvent);

    await waitFor(() => {
      expect(onListCreated).toHaveBeenCalledWith(mockEvent);
    });
  });

  it('should call onCardMoved callback with event', async () => {
    const onCardMoved = vi.fn();
    let capturedHandler: ((event: CardMovedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'card:moved') {
        capturedHandler = handler as (event: CardMovedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        onCardMoved,
      }),
    );

    const mockEvent: CardMovedEvent = {
      boardId: mockBoardId,
      cardId: 'card-1',
      fromListId: 'list-1',
      toListId: 'list-2',
      position: 1,
      movedBy: { userId: 'other-user', name: 'Other User' },
      timestamp: new Date(),
    };

    capturedHandler!(mockEvent);

    await waitFor(() => {
      expect(onCardMoved).toHaveBeenCalledWith(mockEvent);
    });
  });

  it('should deduplicate events from current user', async () => {
    const onBoardUpdated = vi.fn();
    let capturedHandler: ((event: BoardUpdatedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'board:updated') {
        capturedHandler = handler as (event: BoardUpdatedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        currentUserId: mockUserId,
        onBoardUpdated,
      }),
    );

    // Event from current user - should be ignored
    const ownEvent: BoardUpdatedEvent = {
      boardId: mockBoardId,
      board: { id: mockBoardId, title: 'Updated', createdAt: new Date(), updatedAt: new Date() },
      updatedBy: { userId: mockUserId, name: 'Current User' },
      timestamp: new Date(),
    };

    capturedHandler!(ownEvent);

    await waitFor(() => {
      expect(onBoardUpdated).not.toHaveBeenCalled();
    });
  });

  it('should process events from other users', async () => {
    const onBoardUpdated = vi.fn();
    let capturedHandler: ((event: BoardUpdatedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'board:updated') {
        capturedHandler = handler as (event: BoardUpdatedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        currentUserId: mockUserId,
        onBoardUpdated,
      }),
    );

    // Event from other user - should be processed
    const otherEvent: BoardUpdatedEvent = {
      boardId: mockBoardId,
      board: { id: mockBoardId, title: 'Updated', createdAt: new Date(), updatedAt: new Date() },
      updatedBy: { userId: 'other-user', name: 'Other User' },
      timestamp: new Date(),
    };

    capturedHandler!(otherEvent);

    await waitFor(() => {
      expect(onBoardUpdated).toHaveBeenCalledWith(otherEvent);
    });
  });

  it('should process events when no currentUserId provided', async () => {
    const onBoardUpdated = vi.fn();
    let capturedHandler: ((event: BoardUpdatedEvent) => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'board:updated') {
        capturedHandler = handler as (event: BoardUpdatedEvent) => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        // No currentUserId - all events should be processed
        onBoardUpdated,
      }),
    );

    const mockEvent: BoardUpdatedEvent = {
      boardId: mockBoardId,
      board: { id: mockBoardId, title: 'Updated', createdAt: new Date(), updatedAt: new Date() },
      updatedBy: { userId: 'any-user', name: 'Any User' },
      timestamp: new Date(),
    };

    capturedHandler!(mockEvent);

    await waitFor(() => {
      expect(onBoardUpdated).toHaveBeenCalledWith(mockEvent);
    });
  });

  it('should call onReconnect callback on reconnect event', async () => {
    const onReconnect = vi.fn();
    let capturedHandler: (() => void) | null = null;

    vi.mocked(webSocketService.on).mockImplementation((event, handler) => {
      if (event === 'reconnect') {
        capturedHandler = handler as () => void;
      }
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
        onReconnect,
      }),
    );

    capturedHandler!();

    await waitFor(() => {
      expect(onReconnect).toHaveBeenCalled();
    });
  });

  it('should unsubscribe from all events on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    unmount();

    // Verify unsubscription from all events
    expect(webSocketService.off).toHaveBeenCalledWith('board:updated', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('board:member:joined', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('board:member:left', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('list:created', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('list:updated', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('list:deleted', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('lists:reordered', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('card:created', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('card:updated', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('card:moved', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('card:deleted', expect.any(Function));
    expect(webSocketService.off).toHaveBeenCalledWith('reconnect', expect.any(Function));
  });

  it('should handle boardId changes', () => {
    const mockJoinBoard = vi.fn();
    const mockLeaveBoard = vi.fn();

    vi.mocked(require('@/hooks/websocket/useWebSocket').useWebSocket).mockReturnValue({
      isConnected: true,
      joinBoard: mockJoinBoard,
      leaveBoard: mockLeaveBoard,
    });

    const { rerender } = renderHook(({ boardId }) => useRealtimeBoardUpdates({ boardId }), {
      initialProps: { boardId: 'board-1' },
    });

    expect(mockJoinBoard).toHaveBeenCalledWith('board-1');

    // Change boardId
    rerender({ boardId: 'board-2' });

    expect(mockLeaveBoard).toHaveBeenCalledWith('board-1');
    expect(mockJoinBoard).toHaveBeenCalledWith('board-2');
  });

  it('should not subscribe when disconnected', () => {
    vi.mocked(require('@/hooks/websocket/useWebSocket').useWebSocket).mockReturnValue({
      isConnected: false,
      joinBoard: vi.fn(),
      leaveBoard: vi.fn(),
    });

    renderHook(() =>
      useRealtimeBoardUpdates({
        boardId: mockBoardId,
      }),
    );

    // Should not subscribe to events when disconnected
    expect(webSocketService.on).not.toHaveBeenCalled();
  });
});
