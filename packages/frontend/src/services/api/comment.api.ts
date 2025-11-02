import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Comment } from './card.api';

/**
 * Comment API Client (T156)
 * Handles all HTTP requests related to comments
 * User Story 2: Enrich Cards with Details
 */

export interface CreateCommentDto {
  content: string;
}

export class CommentApiClient {
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
   * Get all comments for a card
   */
  async getCardComments(cardId: string): Promise<Comment[]> {
    const response = await this.client.get<Comment[]>(`/cards/${cardId}/comments`);
    return response.data;
  }

  /**
   * Add a comment to a card
   */
  async addComment(cardId: string, dto: CreateCommentDto): Promise<Comment> {
    const response = await this.client.post<Comment>(`/cards/${cardId}/comments`, dto);
    return response.data;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await this.client.delete(`/comments/${commentId}`);
  }
}

// Export singleton instance
export const commentApi = new CommentApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
