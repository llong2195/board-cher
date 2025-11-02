import axios from 'axios';
import type { AxiosInstance, AxiosProgressEvent } from 'axios';
import type { Attachment } from './card.api';

/**
 * Attachment API Client (T157)
 * Handles all HTTP requests related to attachments
 * User Story 2: Enrich Cards with Details
 * Includes upload progress tracking
 */

export interface UploadAttachmentOptions {
  name?: string;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export class AttachmentApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.client = axios.create({
      baseURL,
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
   * Upload an attachment to a card with progress tracking
   */
  async uploadAttachment(
    cardId: string,
    file: File,
    options?: UploadAttachmentOptions,
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.name) {
      formData.append('name', options.name);
    }

    const response = await this.client.post<Attachment>(`/cards/${cardId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return response.data;
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await this.client.get<Blob>(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.delete(`/attachments/${attachmentId}`);
  }

  /**
   * Get upload progress percentage from AxiosProgressEvent
   */
  static getUploadProgress(progressEvent: AxiosProgressEvent): number {
    if (!progressEvent.total) return 0;
    return Math.round((progressEvent.loaded * 100) / progressEvent.total);
  }
}

// Export singleton instance
export const attachmentApi = new AttachmentApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
);
