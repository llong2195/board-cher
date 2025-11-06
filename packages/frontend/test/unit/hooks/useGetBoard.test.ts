/**
 * Unit tests for useGetBoard hook
 * Tests query hook functionality for fetching single board
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGetBoard } from '@/hooks/api/useGetBoard';
import { boardService } from '@/services/api/board.service';
import type { Board } from '@/types/board.types';

// Mock dependencies
vi.mock('@/services/api/board.service');
vi.mock('@/hooks/common/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('useGetBoard', () => {
  const mockBoard: Board = {
    id: 'board-123',
    name: 'Test Board',
    description: 'Test Description',
    lists: [],
    members: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch board data successfully', async () => {
    vi.mocked(boardService.getBoard).mockResolvedValue(mockBoard);

    const { result } = renderHook(() => useGetBoard('board-123'));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBoard);
    expect(result.current.error).toBeNull();
    expect(boardService.getBoard).toHaveBeenCalledWith('board-123');
  });

  it('should handle empty boardId', async () => {
    const { result } = renderHook(() => useGetBoard(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(boardService.getBoard).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const error = new Error('Board not found');
    vi.mocked(boardService.getBoard).mockRejectedValue(error);

    const { result } = renderHook(() => useGetBoard('board-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should support refetch', async () => {
    vi.mocked(boardService.getBoard).mockResolvedValue(mockBoard);

    const { result } = renderHook(() => useGetBoard('board-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mocks and set new data
    vi.mocked(boardService.getBoard).mockClear();
    const updatedBoard = { ...mockBoard, name: 'Updated Board' };
    vi.mocked(boardService.getBoard).mockResolvedValue(updatedBoard);

    // Refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data?.name).toBe('Updated Board');
    });

    expect(boardService.getBoard).toHaveBeenCalledTimes(1);
  });

  it('should refetch when boardId changes', async () => {
    vi.mocked(boardService.getBoard).mockResolvedValue(mockBoard);

    const { result, rerender } = renderHook(({ id }) => useGetBoard(id), {
      initialProps: { id: 'board-123' },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(boardService.getBoard).toHaveBeenCalledWith('board-123');

    // Change boardId
    const newBoard = { ...mockBoard, id: 'board-456', name: 'New Board' };
    vi.mocked(boardService.getBoard).mockResolvedValue(newBoard);

    rerender({ id: 'board-456' });

    await waitFor(() => {
      expect(result.current.data?.id).toBe('board-456');
    });

    expect(boardService.getBoard).toHaveBeenCalledWith('board-456');
  });
});
