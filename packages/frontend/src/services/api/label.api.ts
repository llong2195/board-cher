import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Label } from './card.api';

/**
 * Label API Client (T158)
 * Handles all HTTP requests related to labels
 * User Story 2: Enrich Cards with Details
 */

export interface CreateLabelDto {
  color: string;
  name?: string;
}

export class LabelApiClient {
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
   * Get all labels for a board
   */
  async getBoardLabels(boardId: string): Promise<Label[]> {
    const response = await this.client.get<Label[]>(`/boards/${boardId}/labels`);
    return response.data;
  }

  /**
   * Create a new label for a board
   */
  async createLabel(boardId: string, dto: CreateLabelDto): Promise<Label> {
    const response = await this.client.post<Label>(`/boards/${boardId}/labels`, dto);
    return response.data;
  }

  /**
   * Apply a label to a card
   */
  async applyLabelToCard(cardId: string, labelId: string): Promise<void> {
    await this.client.post(`/cards/${cardId}/labels/${labelId}`);
  }

  /**
   * Remove a label from a card
   */
  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    await this.client.delete(`/cards/${cardId}/labels/${labelId}`);
  }
}

// Export singleton instance
export const labelApi = new LabelApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
