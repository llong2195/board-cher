// Board API Service
// Pure functions for board-related API calls

import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types/board.types';

export const boardService = {
  // Get all boards for current user
  getBoards: async (): Promise<Board[]> => {
    const response = await apiClient.get<ApiResponse<Board[]>>('/boards');
    return response.data.data;
  },

  // Get single board by ID with all lists and cards
  getBoard: async (id: string): Promise<Board> => {
    const response = await apiClient.get<ApiResponse<Board>>(`/boards/${id}`);
    return response.data.data;
  },

  // Create new board
  createBoard: async (data: CreateBoardDto): Promise<Board> => {
    const response = await apiClient.post<ApiResponse<Board>>('/boards', data);
    return response.data.data;
  },

  // Update existing board
  updateBoard: async (id: string, data: UpdateBoardDto): Promise<Board> => {
    const response = await apiClient.patch<ApiResponse<Board>>(`/boards/${id}`, data);
    return response.data.data;
  },

  // Delete board
  deleteBoard: async (id: string): Promise<void> => {
    await apiClient.delete(`/boards/${id}`);
  },
};
