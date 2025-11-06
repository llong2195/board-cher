/**
 * Unit tests for useCreateCard hook
 * Tests mutation hook functionality for creating cards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateCard } from '@/hooks/api/useCreateCard';
import { cardService } from '@/services/api/card.service';
import type { Card, CreateCardDto } from '@/types/card.types';

// Mock dependencies
vi.mock('@/services/api/card.service');
vi.mock('@/hooks/common/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('useCreateCard', () => {
  const mockCard: Card = {
    id: 'card-123',
    listId: 'list-123',
    title: 'Test Card',
    description: 'Test Description',
    position: 0,
    labels: [],
    assignees: [],
    attachments: [],
    comments: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-123',
  };

  const createCardDto: CreateCardDto = {
    listId: 'list-123',
    title: 'Test Card',
    description: 'Test Description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create card successfully', async () => {
    vi.mocked(cardService.createCard).mockResolvedValue(mockCard);

    const { result } = renderHook(() => useCreateCard());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    let createdCard: Card | undefined;
    await act(async () => {
      createdCard = await result.current.mutate(createCardDto);
    });

    expect(createdCard).toEqual(mockCard);
    expect(result.current.data).toEqual(mockCard);
    expect(result.current.error).toBeNull();
    expect(cardService.createCard).toHaveBeenCalledWith(createCardDto);
  });

  it('should handle creation error', async () => {
    const error = new Error('Failed to create card');
    vi.mocked(cardService.createCard).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateCard());

    await act(async () => {
      try {
        await result.current.mutate(createCardDto);
      } catch (err) {
        // Expected to throw
        expect(err).toEqual(error);
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should call onSuccess callback', async () => {
    vi.mocked(cardService.createCard).mockResolvedValue(mockCard);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useCreateCard({ onSuccess }));

    await act(async () => {
      await result.current.mutate(createCardDto);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockCard, createCardDto);
  });

  it('should call onError callback', async () => {
    const error = new Error('Creation failed');
    vi.mocked(cardService.createCard).mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useCreateCard({ onError }));

    await act(async () => {
      try {
        await result.current.mutate(createCardDto);
      } catch {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(error, createCardDto);
  });

  it('should call onSettled callback', async () => {
    vi.mocked(cardService.createCard).mockResolvedValue(mockCard);
    const onSettled = vi.fn();

    const { result } = renderHook(() => useCreateCard({ onSettled }));

    await act(async () => {
      await result.current.mutate(createCardDto);
    });

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalled();
    });
  });

  it('should reset state', async () => {
    vi.mocked(cardService.createCard).mockResolvedValue(mockCard);

    const { result } = renderHook(() => useCreateCard());

    await act(async () => {
      await result.current.mutate(createCardDto);
    });

    expect(result.current.data).toEqual(mockCard);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle multiple mutations', async () => {
    vi.mocked(cardService.createCard).mockResolvedValue(mockCard);

    const { result } = renderHook(() => useCreateCard());

    // First mutation
    await act(async () => {
      await result.current.mutate(createCardDto);
    });

    expect(result.current.data).toEqual(mockCard);

    // Second mutation with different data
    const secondCard = { ...mockCard, id: 'card-456', title: 'Second Card' };
    vi.mocked(cardService.createCard).mockResolvedValue(secondCard);

    const secondDto = { ...createCardDto, title: 'Second Card' };
    await act(async () => {
      await result.current.mutate(secondDto);
    });

    expect(result.current.data).toEqual(secondCard);
    expect(cardService.createCard).toHaveBeenCalledTimes(2);
  });
});
