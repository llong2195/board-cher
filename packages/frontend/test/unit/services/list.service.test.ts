/**
 * Unit tests for list.service
 * Tests list API service functions with mocked axios client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listService } from '@/services/api/list.service';
import { apiClient } from '@/services/api/client';
import type { List, CreateListDto, UpdateListDto, ReorderListsDto } from '@/types/list.types';
import type { ApiResponse } from '@/types/api.types';

// Mock the API client
vi.mock('@/services/api/client');

describe('listService', () => {
  const mockList: List = {
    id: 'list-123',
    boardId: 'board-123',
    name: 'Test List',
    position: 0,
    cards: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createList', () => {
    it('should create new list successfully', async () => {
      const createDto: CreateListDto = {
        boardId: 'board-123',
        name: 'New List',
        position: 0,
      };

      const createdList: List = {
        ...mockList,
        name: 'New List',
      };

      const mockResponse: ApiResponse<List> = {
        data: createdList,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await listService.createList(createDto);

      expect(result).toEqual(createdList);
      expect(apiClient.post).toHaveBeenCalledWith('/lists', createDto);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateListDto = {
        boardId: 'board-123',
        name: '',
      };

      const error = new Error('Validation failed: name is required');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(listService.createList(createDto)).rejects.toThrow('Validation failed');
    });

    it('should create list without explicit position', async () => {
      const createDto: CreateListDto = {
        boardId: 'board-123',
        name: 'Auto-positioned List',
      };

      const createdList: List = {
        ...mockList,
        name: 'Auto-positioned List',
        position: 5,
      };

      const mockResponse: ApiResponse<List> = {
        data: createdList,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await listService.createList(createDto);

      expect(result.position).toBe(5); // Should be auto-calculated by backend
    });
  });

  describe('updateList', () => {
    it('should update list successfully', async () => {
      const updateDto: UpdateListDto = {
        name: 'Updated List',
      };

      const updatedList: List = {
        ...mockList,
        name: 'Updated List',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const mockResponse: ApiResponse<List> = {
        data: updatedList,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await listService.updateList('list-123', updateDto);

      expect(result).toEqual(updatedList);
      expect(apiClient.patch).toHaveBeenCalledWith('/lists/list-123', updateDto);
    });

    it('should update list position', async () => {
      const updateDto: UpdateListDto = {
        position: 3,
      };

      const updatedList: List = {
        ...mockList,
        position: 3,
      };

      const mockResponse: ApiResponse<List> = {
        data: updatedList,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await listService.updateList('list-123', updateDto);

      expect(result.position).toBe(3);
    });
  });

  describe('deleteList', () => {
    it('should delete list successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null });

      await listService.deleteList('list-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/lists/list-123');
    });

    it('should throw error if list not found', async () => {
      const error = new Error('List not found');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(listService.deleteList('invalid-id')).rejects.toThrow('List not found');
    });

    it('should throw error if unauthorized', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(listService.deleteList('list-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('reorderLists', () => {
    it('should reorder lists successfully', async () => {
      const reorderDto: ReorderListsDto = {
        boardId: 'board-123',
        listIds: ['list-1', 'list-2', 'list-3'],
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: null });

      await listService.reorderLists(reorderDto);

      expect(apiClient.patch).toHaveBeenCalledWith('/lists/reorder', reorderDto);
    });

    it('should handle reorder with single list', async () => {
      const reorderDto: ReorderListsDto = {
        boardId: 'board-123',
        listIds: ['list-1'],
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: null });

      await listService.reorderLists(reorderDto);

      expect(apiClient.patch).toHaveBeenCalledWith('/lists/reorder', reorderDto);
    });

    it('should throw error if board not found', async () => {
      const reorderDto: ReorderListsDto = {
        boardId: 'invalid-board',
        listIds: ['list-1', 'list-2'],
      };

      const error = new Error('Board not found');
      vi.mocked(apiClient.patch).mockRejectedValue(error);

      await expect(listService.reorderLists(reorderDto)).rejects.toThrow('Board not found');
    });
  });
});
