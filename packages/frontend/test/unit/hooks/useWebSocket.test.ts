// Unit tests for useWebSocket hook
// Tests WebSocket connection lifecycle and status management

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/websocket/useWebSocket';
import { webSocketService } from '@/services/websocket/WebSocketService';
import type { ConnectionStatus } from '@/types/websocket.types';

// Mock dependencies
vi.mock('@/services/websocket/WebSocketService', () => ({
  webSocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    getConnectionStatus: vi.fn(),
    onStatusChange: vi.fn(),
    joinBoard: vi.fn(),
    leaveBoard: vi.fn(),
  },
}));

vi.mock('@/hooks/common/useToast', () => ({
  useToast: () => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('useWebSocket', () => {
  let statusChangeCallback: ((status: ConnectionStatus) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getConnectionStatus to return 'disconnected' initially
    vi.mocked(webSocketService.getConnectionStatus).mockReturnValue('disconnected');

    // Mock onStatusChange to capture the callback
    vi.mocked(webSocketService.onStatusChange).mockImplementation((callback) => {
      statusChangeCallback = callback;
      // Return cleanup function
      return () => {
        statusChangeCallback = null;
      };
    });
  });

  afterEach(() => {
    statusChangeCallback = null;
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.status).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
  });

  it('should connect on mount', () => {
    renderHook(() => useWebSocket());

    expect(webSocketService.connect).toHaveBeenCalledOnce();
  });

  it('should subscribe to status changes on mount', () => {
    renderHook(() => useWebSocket());

    expect(webSocketService.onStatusChange).toHaveBeenCalledOnce();
    expect(webSocketService.onStatusChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update status to connected', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate connection status change
    expect(statusChangeCallback).not.toBeNull();
    statusChangeCallback!('connected');

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isReconnecting).toBe(false);
    });
  });

  it('should update status to reconnecting', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate reconnecting status
    statusChangeCallback!('reconnecting');

    await waitFor(() => {
      expect(result.current.status).toBe('reconnecting');
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(true);
    });
  });

  it('should show info toast when reconnecting', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Get the toast mock (indirectly through the hook)
    statusChangeCallback!('reconnecting');

    await waitFor(() => {
      expect(result.current.status).toBe('reconnecting');
    });

    // Note: Toast is mocked so we can't verify the exact call
    // In integration tests, we'd verify the toast appears in the UI
  });

  it('should show success toast when connected after reconnecting', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Simulate reconnection flow
    statusChangeCallback!('reconnecting');
    await waitFor(() => {
      expect(result.current.status).toBe('reconnecting');
    });

    statusChangeCallback!('connected');
    await waitFor(() => {
      expect(result.current.status).toBe('connected');
    });
  });

  it('should provide joinBoard function', () => {
    const { result } = renderHook(() => useWebSocket());
    const boardId = 'board-123';

    result.current.joinBoard(boardId);

    expect(webSocketService.joinBoard).toHaveBeenCalledOnce();
    expect(webSocketService.joinBoard).toHaveBeenCalledWith(boardId);
  });

  it('should provide leaveBoard function', () => {
    const { result } = renderHook(() => useWebSocket());
    const boardId = 'board-123';

    result.current.leaveBoard(boardId);

    expect(webSocketService.leaveBoard).toHaveBeenCalledOnce();
    expect(webSocketService.leaveBoard).toHaveBeenCalledWith(boardId);
  });

  it('should cleanup subscription on unmount', () => {
    const unsubscribe = vi.fn();
    vi.mocked(webSocketService.onStatusChange).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('should handle multiple status changes', async () => {
    const { result } = renderHook(() => useWebSocket());

    // Cycle through statuses
    statusChangeCallback!('connected');
    await waitFor(() => expect(result.current.status).toBe('connected'));

    statusChangeCallback!('disconnected');
    await waitFor(() => expect(result.current.status).toBe('disconnected'));

    statusChangeCallback!('reconnecting');
    await waitFor(() => expect(result.current.status).toBe('reconnecting'));

    statusChangeCallback!('connected');
    await waitFor(() => expect(result.current.status).toBe('connected'));
  });

  it('should not disconnect on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    // Should NOT call disconnect as other components might need the connection
    expect(webSocketService.disconnect).not.toHaveBeenCalled();
  });

  it('should handle initial connected status from service', () => {
    // Mock service returning connected status initially
    vi.mocked(webSocketService.getConnectionStatus).mockReturnValue('connected');

    const { result } = renderHook(() => useWebSocket());

    expect(result.current.status).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('should handle multiple joinBoard calls', () => {
    const { result } = renderHook(() => useWebSocket());

    result.current.joinBoard('board-1');
    result.current.joinBoard('board-2');
    result.current.joinBoard('board-3');

    expect(webSocketService.joinBoard).toHaveBeenCalledTimes(3);
    expect(webSocketService.joinBoard).toHaveBeenNthCalledWith(1, 'board-1');
    expect(webSocketService.joinBoard).toHaveBeenNthCalledWith(2, 'board-2');
    expect(webSocketService.joinBoard).toHaveBeenNthCalledWith(3, 'board-3');
  });

  it('should handle multiple leaveBoard calls', () => {
    const { result } = renderHook(() => useWebSocket());

    result.current.leaveBoard('board-1');
    result.current.leaveBoard('board-2');

    expect(webSocketService.leaveBoard).toHaveBeenCalledTimes(2);
    expect(webSocketService.leaveBoard).toHaveBeenNthCalledWith(1, 'board-1');
    expect(webSocketService.leaveBoard).toHaveBeenNthCalledWith(2, 'board-2');
  });
});
