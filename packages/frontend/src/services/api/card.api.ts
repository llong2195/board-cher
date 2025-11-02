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
  // US2: Enriched data
  comments?: Comment[];
  attachments?: Attachment[];
  labels?: Label[];
  checklists?: Checklist[];
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  cardId: string;
  userId: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  formattedSize: string;
  url: string;
  isImage: boolean;
  extension: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  boardId: string;
  name: string | null;
  color: string;
  hexColor: string;
  displayText: string;
  isColorOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  cardId: string;
  name: string;
  position: number;
  items: ChecklistItem[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  isComplete: boolean;
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

export interface UpdateCardDetailsDto {
  title?: string;
  description?: string;
  dueDate?: Date | null;
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
   * Get card by ID (with enriched details - T155)
   */
  async getCard(id: string): Promise<Card> {
    const response = await this.client.get<Card>(`/cards/${id}`);
    return response.data;
  }

  /**
   * Get card details with enriched data (US2 - T155)
   * Includes: comments, attachments, labels, checklists
   */
  async getDetails(id: string): Promise<Card> {
    const response = await this.client.get<Card>(`/cards/${id}`);
    return response.data;
  }

  /**
   * Update card basic fields (US1)
   */
  async updateCard(id: string, dto: UpdateCardDto): Promise<Card> {
    const response = await this.client.put<Card>(`/cards/${id}`, dto);
    return response.data;
  }

  /**
   * Update card details (US2 - T155)
   * Updates title, description, and/or dueDate
   */
  async updateDetails(id: string, dto: UpdateCardDetailsDto): Promise<Card> {
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
