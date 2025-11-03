/**
 * T213 - Notification Service
 * User Story 6: Card Assignment and Notifications
 *
 * In-memory notification service for managing user notifications
 * Can be extended later for email/push notifications
 */

import { Injectable } from '@nestjs/common';

export enum NotificationType {
  CARD_ASSIGNED = 'card_assigned',
  CARD_COMMENT_ADDED = 'card_comment_added',
  CARD_DUE_SOON = 'card_due_soon',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Create a new notification for a user
   */
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date(),
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.push(notification);
    this.notifications.set(userId, userNotifications);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  getNotifications(
    userId: string,
    unreadOnly: boolean = false,
  ): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      return userNotifications.filter((n) => !n.isRead);
    }

    return userNotifications;
  }

  /**
   * Mark a notification as read
   */
  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) {
      return false;
    }

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (!notification) {
      return false;
    }

    notification.isRead = true;
    return true;
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): number {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) {
      return 0;
    }

    let count = 0;
    for (const notification of userNotifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        count++;
      }
    }

    return count;
  }

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.isRead).length;
  }

  /**
   * Clear all notifications for a user
   */
  clearNotifications(userId: string): void {
    this.notifications.delete(userId);
  }

  /**
   * Generate a unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
