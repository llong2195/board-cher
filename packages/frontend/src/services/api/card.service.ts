// Card API Service
// Pure functions for card-related API calls

import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Card, CreateCardDto, UpdateCardDto, MoveCardDto } from '@/types/card.types';

export const cardService = {
  // Get single card by ID
  getCard: async (id: string): Promise<Card> => {
    const response = await apiClient.get<ApiResponse<Card>>(`/cards/${id}`);
    return response.data.data;
  },

  // Create new card in a list
  createCard: async (data: CreateCardDto): Promise<Card> => {
    const response = await apiClient.post<ApiResponse<Card>>('/cards', data);
    return response.data.data;
  },

  // Update existing card
  updateCard: async (id: string, data: UpdateCardDto): Promise<Card> => {
    const response = await apiClient.patch<ApiResponse<Card>>(`/cards/${id}`, data);
    return response.data.data;
  },

  // Move card between lists or reorder within list
  moveCard: async (data: MoveCardDto): Promise<Card> => {
    const response = await apiClient.patch<ApiResponse<Card>>('/cards/move', data);
    return response.data.data;
  },

  // Delete card
  deleteCard: async (id: string): Promise<void> => {
    await apiClient.delete(`/cards/${id}`);
  },
};
