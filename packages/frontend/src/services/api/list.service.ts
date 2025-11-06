// List API Service
// Pure functions for list-related API calls

import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { List, CreateListDto, UpdateListDto, ReorderListsDto } from '@/types/list.types';

export const listService = {
  // Create new list on a board
  createList: async (data: CreateListDto): Promise<List> => {
    const response = await apiClient.post<ApiResponse<List>>('/lists', data);
    return response.data.data;
  },

  // Update existing list
  updateList: async (id: string, data: UpdateListDto): Promise<List> => {
    const response = await apiClient.patch<ApiResponse<List>>(`/lists/${id}`, data);
    return response.data.data;
  },

  // Delete list and all its cards
  deleteList: async (id: string): Promise<void> => {
    await apiClient.delete(`/lists/${id}`);
  },

  // Reorder lists on a board
  reorderLists: async (data: ReorderListsDto): Promise<void> => {
    await apiClient.patch('/lists/reorder', data);
  },
};
