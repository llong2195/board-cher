/**
 * Unit tests for board.service
 * Tests board API service functions with mocked axios client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boardService } from '@/services/api/board.service';
import { apiClient } from '@/services/api/client';
import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types/board.types';
import type { ApiResponse } from '@/types/api.types';

// Mock the API client
vi.mock('@/services/api/client');

describe('boardService', () => {
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

  describe('getBoards', () => {
    it('should fetch all boards successfully', async () => {
      const boards = [mockBoard];
      const mockResponse: ApiResponse<Board[]> = {
        data: boards,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await boardService.getBoards();

      expect(result).toEqual(boards);
      expect(apiClient.get).toHaveBeenCalledWith('/boards');
    });

    it('should return empty array when no boards exist', async () => {
      const mockResponse: ApiResponse<Board[]> = {
        data: [],
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await boardService.getBoards();

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(boardService.getBoards()).rejects.toThrow('Network error');
    });
  });

  describe('getBoard', () => {
    it('should fetch single board by ID', async () => {
      const mockResponse: ApiResponse<Board> = {
        data: mockBoard,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await boardService.getBoard('board-123');

      expect(result).toEqual(mockBoard);
      expect(apiClient.get).toHaveBeenCalledWith('/boards/board-123');
    });

    it('should throw error when board not found', async () => {
      const error = new Error('Board not found');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(boardService.getBoard('invalid-id')).rejects.toThrow('Board not found');
    });
  });

  describe('createBoard', () => {
    it('should create new board successfully', async () => {
      const createDto: CreateBoardDto = {
        name: 'New Board',
        description: 'New Description',
      };

      const createdBoard: Board = {
        ...mockBoard,
        name: 'New Board',
        description: 'New Description',
      };

      const mockResponse: ApiResponse<Board> = {
        data: createdBoard,
        timestamp: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await boardService.createBoard(createDto);

      expect(result).toEqual(createdBoard);
      expect(apiClient.post).toHaveBeenCalledWith('/boards', createDto);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateBoardDto = {
        name: '',
        description: 'Description',
      };

      const error = new Error('Validation failed: name is required');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(boardService.createBoard(createDto)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateBoard', () => {
    it('should update board successfully', async () => {
      const updateDto: UpdateBoardDto = {
        name: 'Updated Board',
      };

      const updatedBoard: Board = {
        ...mockBoard,
        name: 'Updated Board',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const mockResponse: ApiResponse<Board> = {
        data: updatedBoard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await boardService.updateBoard('board-123', updateDto);

      expect(result).toEqual(updatedBoard);
      expect(apiClient.patch).toHaveBeenCalledWith('/boards/board-123', updateDto);
    });

    it('should allow partial updates', async () => {
      const updateDto: UpdateBoardDto = {
        description: 'Only description updated',
      };

      const updatedBoard: Board = {
        ...mockBoard,
        description: 'Only description updated',
      };

      const mockResponse: ApiResponse<Board> = {
        data: updatedBoard,
        timestamp: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockResponse });

      const result = await boardService.updateBoard('board-123', updateDto);

      expect(result.description).toBe('Only description updated');
      expect(result.name).toBe(mockBoard.name); // Should remain unchanged
    });
  });

  describe('deleteBoard', () => {
    it('should delete board successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null });

      await boardService.deleteBoard('board-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/boards/board-123');
    });

    it('should throw error if board not found', async () => {
      const error = new Error('Board not found');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(boardService.deleteBoard('invalid-id')).rejects.toThrow('Board not found');
    });

    it('should throw error if unauthorized', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(boardService.deleteBoard('board-123')).rejects.toThrow('Unauthorized');
    });
  });
});
