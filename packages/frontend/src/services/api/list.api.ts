import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * List API Client
 * Handles all HTTP requests related to lists
 */

export interface List {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListDto {
  name: string;
}

export interface MoveListDto {
  name?: string;
  position?: number;
}

export class ListApiClient {
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
   * Create a new list in a board
   */
  async createList(boardId: string, dto: CreateListDto): Promise<List> {
    const response = await this.client.post<List>(`/boards/${boardId}/lists`, dto);
    return response.data;
  }

  /**
   * Get all lists in a board
   */
  async getBoardLists(boardId: string): Promise<List[]> {
    const response = await this.client.get<List[]>(`/boards/${boardId}/lists`);
    return response.data;
  }

  /**
   * Update/Move a list
   */
  async updateList(id: string, dto: MoveListDto): Promise<List> {
    const response = await this.client.put<List>(`/lists/${id}`, dto);
    return response.data;
  }

  /**
   * Move a list to a new position
   */
  async moveList(id: string, position: number): Promise<List> {
    return this.updateList(id, { position });
  }

  /**
   * Delete a list
   */
  async deleteList(id: string): Promise<void> {
    await this.client.delete(`/lists/${id}`);
  }
}

// Export singleton instance
export const listApi = new ListApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
