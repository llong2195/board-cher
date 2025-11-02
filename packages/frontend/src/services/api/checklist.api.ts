import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Checklist } from './card.api';

/**
 * Checklist API Client (T159)
 * Handles all HTTP requests related to checklists
 * User Story 2: Enrich Cards with Details
 */

export interface CreateChecklistDto {
  name: string;
  position?: number;
}

export interface AddChecklistItemDto {
  text: string;
  position: number;
}

export class ChecklistApiClient {
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
   * Create a new checklist for a card
   */
  async createChecklist(cardId: string, dto: CreateChecklistDto): Promise<Checklist> {
    const response = await this.client.post<Checklist>(`/cards/${cardId}/checklists`, dto);
    return response.data;
  }

  /**
   * Add an item to a checklist
   */
  async addChecklistItem(checklistId: string, dto: AddChecklistItemDto): Promise<Checklist> {
    const response = await this.client.post<Checklist>(`/checklists/${checklistId}/items`, dto);
    return response.data;
  }

  /**
   * Toggle a checklist item's completion status
   */
  async toggleChecklistItem(itemId: string): Promise<Checklist> {
    const response = await this.client.put<Checklist>(`/checklist-items/${itemId}/toggle`);
    return response.data;
  }

  /**
   * Delete a checklist
   */
  async deleteChecklist(checklistId: string): Promise<void> {
    await this.client.delete(`/checklists/${checklistId}`);
  }

  /**
   * Delete a checklist item
   */
  async deleteChecklistItem(itemId: string): Promise<void> {
    await this.client.delete(`/checklist-items/${itemId}`);
  }
}

// Export singleton instance
export const checklistApi = new ChecklistApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
