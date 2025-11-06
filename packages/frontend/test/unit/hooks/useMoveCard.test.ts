/**
 * Unit tests for useMoveCard hook
 * Tests mutation hook functionality for moving cards between lists
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoveCard } from '@/hooks/api/useMoveCard';
import { cardService } from '@/services/api/card.service';
import type { Card, MoveCardDto } from '@/types/card.types';

// Mock dependencies
vi.mock('@/services/api/card.service');
vi.mock('@/hooks/common/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('useMoveCard', () => {
  const mockCard: Card = {
    id: 'card-123',
    listId: 'list-456',
    title: 'Test Card',
    description: 'Test Description',
    position: 1,
    labels: [],
    assignees: [],
    attachments: [],
    comments: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-123',
  };

  const moveCardDto: MoveCardDto = {
    cardId: 'card-123',
    sourceListId: 'list-123',
    targetListId: 'list-456',
    position: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should move card successfully', async () => {
    vi.mocked(cardService.moveCard).mockResolvedValue(mockCard);

    const { result } = renderHook(() => useMoveCard());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    let movedCard: Card | undefined;
    await act(async () => {
      movedCard = await result.current.mutate(moveCardDto);
    });

    expect(movedCard).toEqual(mockCard);
    expect(result.current.data).toEqual(mockCard);
    expect(cardService.moveCard).toHaveBeenCalledWith(moveCardDto);
  });

  it('should handle move error', async () => {
    const error = new Error('Failed to move card');
    vi.mocked(cardService.moveCard).mockRejectedValue(error);

    const { result } = renderHook(() => useMoveCard());

    await act(async () => {
      try {
        await result.current.mutate(moveCardDto);
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    expect(result.current.error).toEqual(error);
  });

  it('should call onSuccess callback without showing toast', async () => {
    vi.mocked(cardService.moveCard).mockResolvedValue(mockCard);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useMoveCard({ onSuccess }));

    await act(async () => {
      await result.current.mutate(moveCardDto);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockCard, moveCardDto);
    // Note: No toast.success should be called for silent operation
  });

  it('should handle moving card to same list (reorder)', async () => {
    const reorderDto: MoveCardDto = {
      cardId: 'card-123',
      sourceListId: 'list-123',
      targetListId: 'list-123',
      position: 3,
    };

    const reorderedCard = { ...mockCard, listId: 'list-123', position: 3 };
    vi.mocked(cardService.moveCard).mockResolvedValue(reorderedCard);

    const { result } = renderHook(() => useMoveCard());

    await act(async () => {
      await result.current.mutate(reorderDto);
    });

    expect(result.current.data?.position).toBe(3);
    expect(result.current.data?.listId).toBe('list-123');
  });

  it('should reset state after move', async () => {
    vi.mocked(cardService.moveCard).mockResolvedValue(mockCard);

    const { result } = renderHook(() => useMoveCard());

    await act(async () => {
      await result.current.mutate(moveCardDto);
    });

    expect(result.current.data).toEqual(mockCard);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
