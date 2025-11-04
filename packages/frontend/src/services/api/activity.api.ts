/**
 * T258 - Activity API Client
 * User Story 7: Activity History and Audit Trail
 *
 * Handles all HTTP requests related to activity history
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Activity action types as string union
export type ActivityActionType =
  // Board actions
  | 'BOARD_CREATED'
  | 'BOARD_UPDATED'
  | 'BOARD_DELETED'
  | 'BOARD_ARCHIVED'
  // List actions
  | 'LIST_CREATED'
  | 'LIST_UPDATED'
  | 'LIST_MOVED'
  | 'LIST_DELETED'
  | 'LIST_ARCHIVED'
  // Card actions
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_MOVED'
  | 'CARD_DELETED'
  | 'CARD_ARCHIVED'
  // Comment actions
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED'
  // Attachment actions
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_DELETED'
  // Label actions
  | 'LABEL_ADDED'
  | 'LABEL_REMOVED'
  | 'LABEL_CREATED'
  | 'LABEL_DELETED'
  // Member actions
  | 'MEMBER_ASSIGNED'
  | 'MEMBER_UNASSIGNED'
  // Checklist actions
  | 'CHECKLIST_CREATED'
  | 'CHECKLIST_ITEM_CHECKED'
  | 'CHECKLIST_ITEM_UNCHECKED'
  // Due date actions
  | 'DUE_DATE_SET'
  | 'DUE_DATE_REMOVED';

// Activity entity types as string union
export type ActivityEntityType =
  | 'BOARD'
  | 'LIST'
  | 'CARD'
  | 'COMMENT'
  | 'ATTACHMENT'
  | 'LABEL'
  | 'CHECKLIST'
  | 'USER';

export interface Activity {
  id: string;
  userId: string;
  userName?: string;
  boardId: string | null;
  cardId: string | null;
  actionType: ActivityActionType;
  entityType: ActivityEntityType;
  entityId: string;
  metadata: Record<string, unknown> | null;
  description: string;
  createdAt: Date;
}

export interface PaginatedActivities {
  data: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export class ActivityApiClient {
  private client: AxiosInstance;

  constructor(token?: string) {
    this.client = axios.create({
      baseURL: API_URL,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get activity history for a card
   */
  async getCardActivity(cardId: string, page = 1, limit = 20): Promise<PaginatedActivities> {
    const response = await this.client.get<PaginatedActivities>(`/cards/${cardId}/activity`, {
      params: { page, limit },
    });

    // Parse dates
    return {
      ...response.data,
      data: response.data.data.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt),
      })),
    };
  }

  /**
   * Get activity history for a board
   */
  async getBoardActivity(boardId: string, page = 1, limit = 20): Promise<PaginatedActivities> {
    const response = await this.client.get<PaginatedActivities>(`/boards/${boardId}/activity`, {
      params: { page, limit },
    });

    // Parse dates
    return {
      ...response.data,
      data: response.data.data.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt),
      })),
    };
  }

  /**
   * Load more activities (for infinite scroll)
   */
  async loadMore(
    type: 'card' | 'board',
    id: string,
    page: number,
    limit = 20,
  ): Promise<PaginatedActivities> {
    if (type === 'card') {
      return this.getCardActivity(id, page, limit);
    } else {
      return this.getBoardActivity(id, page, limit);
    }
  }
}

// Singleton instance
let activityApiClient: ActivityApiClient | null = null;

export function getActivityApiClient(token?: string): ActivityApiClient {
  if (!activityApiClient) {
    activityApiClient = new ActivityApiClient(token);
  } else if (token) {
    activityApiClient.setToken(token);
  }
  return activityApiClient;
}

export default ActivityApiClient;
