/**
 * Unit tests for card.service
 * Tests card API service functions with mocked axios client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cardService } from '@/services/api/card.service';
import { apiClient } from '@/services/api/client';
import type { Card, CreateCardDto, UpdateCardDto, MoveCardDto } from '@/types/card.types';
import type { ApiResponse } from '@/types/api.types';

// Mock the API client
vi.mock('@/services/api/client');

describe('cardService', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCard', () => {
    it('should fetch single card by ID', async () => {
      const mockResponse: ApiResponse<Card> = {
        data: mockCard,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await cardService.getCard('card-123');

      expect(result).toEqual(mockCard);
      expect(apiClient.get).toHaveBeenCalledWith('/cards/card-123');
    });

    it('should throw error when card not found', async () => {
      const error = new Error('Card not found');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(cardService.getCard('invalid-id')).rejects.toThrow('Card not found');
    });
  });

  describe('createCard', () => {
    it('should create new card successfully', async () => {
      const createDto: CreateCardDto = {
        listId: 'list-123',
        title: 'New Card',
        description: 'New Description',
      };

      const createdCard: Card = {
        ...mockCard,
        title: 'New Card',
        description: 'New Description',
      };

      const mockResponse: ApiResponse<Card> = {
        data: createdCard,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await cardService.createCard(createDto);

      expect(result).toEqual(createdCard);
      expect(apiClient.post).toHaveBeenCalledWith('/cards', createDto);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateCardDto = {
        listId: 'list-123',
        title: '',
      };

      const error = new Error('Validation failed: title is required');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(cardService.createCard(createDto)).rejects.toThrow('Validation failed');
    });

    it('should create card with minimal data', async () => {
      const createDto: CreateCardDto = {
        listId: 'list-123',
        title: 'Minimal Card',
      };

      const createdCard: Card = {
        ...mockCard,
        title: 'Minimal Card',
        description: undefined,
      };

      const mockResponse: ApiResponse<Card> = {
        data: createdCard,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await cardService.createCard(createDto);

      expect(result.title).toBe('Minimal Card');
      expect(result.description).toBeUndefined();
    });
  });

  describe('updateCard', () => {
    it('should update card successfully', async () => {
      const updateDto: UpdateCardDto = {
        title: 'Updated Card',
        description: 'Updated Description',
      };

      const updatedCard: Card = {
        ...mockCard,
        title: 'Updated Card',
        description: 'Updated Description',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const mockResponse: ApiResponse<Card> = {
        data: updatedCard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await cardService.updateCard('card-123', updateDto);

      expect(result).toEqual(updatedCard);
      expect(apiClient.patch).toHaveBeenCalledWith('/cards/card-123', updateDto);
    });

    it('should allow partial updates', async () => {
      const updateDto: UpdateCardDto = {
        title: 'Only title updated',
      };

      const updatedCard: Card = {
        ...mockCard,
        title: 'Only title updated',
      };

      const mockResponse: ApiResponse<Card> = {
        data: updatedCard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await cardService.updateCard('card-123', updateDto);

      expect(result.title).toBe('Only title updated');
      expect(result.description).toBe(mockCard.description);
    });
  });

  describe('moveCard', () => {
    it('should move card to different list', async () => {
      const moveDto: MoveCardDto = {
        cardId: 'card-123',
        sourceListId: 'list-123',
        targetListId: 'list-456',
        position: 2,
      };

      const movedCard: Card = {
        ...mockCard,
        listId: 'list-456',
        position: 2,
      };

      const mockResponse: ApiResponse<Card> = {
        data: movedCard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await cardService.moveCard(moveDto);

      expect(result).toEqual(movedCard);
      expect(apiClient.patch).toHaveBeenCalledWith('/cards/move', moveDto);
    });

    it('should reorder card within same list', async () => {
      const moveDto: MoveCardDto = {
        cardId: 'card-123',
        sourceListId: 'list-123',
        targetListId: 'list-123',
        position: 5,
      };

      const movedCard: Card = {
        ...mockCard,
        position: 5,
      };

      const mockResponse: ApiResponse<Card> = {
        data: movedCard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await cardService.moveCard(moveDto);

      expect(result.position).toBe(5);
      expect(result.listId).toBe('list-123');
    });
  });

  describe('deleteCard', () => {
    it('should delete card successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null });

      await cardService.deleteCard('card-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/cards/card-123');
    });

    it('should throw error if card not found', async () => {
      const error = new Error('Card not found');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(cardService.deleteCard('invalid-id')).rejects.toThrow('Card not found');
    });
  });
});
