import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * Board API Client
 * Handles all HTTP requests related to boards
 */

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  labels: Label[];
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardDto {
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  color?: string;
}

export interface PaginatedBoardsResponse {
  data: Board[];
  total: number;
  page: number;
  limit: number;
}

export class BoardApiClient {
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
   * Create a new board
   */
  async createBoard(dto: CreateBoardDto): Promise<Board> {
    const response = await this.client.post<Board>('/boards', dto);
    return response.data;
  }

  /**
   * Get all boards with pagination
   */
  async listBoards(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBoardsResponse> {
    const response = await this.client.get<PaginatedBoardsResponse>('/boards', {
      params: { organizationId, page, limit },
    });
    return response.data;
  }

  /**
   * Get board by ID
   */
  async getBoard(id: string): Promise<Board> {
    const response = await this.client.get<Board>(`/boards/${id}`);
    return response.data;
  }

  /**
   * Update board
   */
  async updateBoard(id: string, dto: UpdateBoardDto): Promise<Board> {
    const response = await this.client.put<Board>(`/boards/${id}`, dto);
    return response.data;
  }

  /**
   * Delete board (soft delete)
   */
  async deleteBoard(id: string): Promise<void> {
    await this.client.delete(`/boards/${id}`);
  }
}

// Export singleton instance
export const boardApi = new BoardApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
