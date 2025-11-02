import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * Card API Client
 * Handles all HTTP requests related to cards
 */

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: Date;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardDto {
  title: string;
  description?: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  dueDate?: Date;
}

export interface MoveCardDto {
  targetListId: string;
  position: number;
}

export class CardApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Create a new card in a list
   */
  async createCard(listId: string, dto: CreateCardDto): Promise<Card> {
    const response = await this.client.post<Card>(`/lists/${listId}/cards`, dto);
    return response.data;
  }

  /**
   * Get all cards in a list
   */
  async getListCards(listId: string): Promise<Card[]> {
    const response = await this.client.get<Card[]>(`/lists/${listId}/cards`);
    return response.data;
  }

  /**
   * Get card by ID
   */
  async getCard(id: string): Promise<Card> {
    const response = await this.client.get<Card>(`/cards/${id}`);
    return response.data;
  }

  /**
   * Update card
   */
  async updateCard(id: string, dto: UpdateCardDto): Promise<Card> {
    const response = await this.client.put<Card>(`/cards/${id}`, dto);
    return response.data;
  }

  /**
   * Move card to different list/position
   */
  async moveCard(id: string, dto: MoveCardDto): Promise<Card> {
    const response = await this.client.post<Card>(`/cards/${id}/move`, dto);
    return response.data;
  }

  /**
   * Delete card
   */
  async deleteCard(id: string): Promise<void> {
    await this.client.delete(`/cards/${id}`);
  }
}

// Export singleton instance
export const cardApi = new CardApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
