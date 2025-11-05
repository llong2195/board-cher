/**
 * T213 - Notification Service
 * User Story 6: Card Assignment and Notifications
 *
 * In-memory notification service for managing user notifications
 * T373: Extended with email notification support via EmailService
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from './email.service';
import { EmailMessage } from '../../domain/shared/value-objects/email-message.vo';
import { NotificationPreferencesEntity } from '../../infrastructure/persistence/entities/notification-preferences.entity';
import { UserEntity } from '../../infrastructure/persistence/entities/user.entity';

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
  private readonly logger = new Logger(NotificationService.name);
  private notifications: Map<string, Notification[]> = new Map();

  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(NotificationPreferencesEntity)
    private readonly preferencesRepository: Repository<NotificationPreferencesEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new notification for a user
   * T373: Now sends email if user has email notifications enabled
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
  ): Promise<Notification> {
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

    // T373: Send email if user preferences allow
    await this.sendEmailNotification(userId, notification);

    return notification;
  }

  /**
   * T373: Send email notification based on user preferences
   */
  private async sendEmailNotification(
    userId: string,
    notification: Notification,
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.preferencesRepository.findOne({
        where: { userId },
      });

      // Check if email notifications are enabled
      if (!preferences || !preferences.emailEnabled) {
        this.logger.debug(
          `Email notifications disabled for user ${userId}, skipping email`,
        );
        return;
      }

      // Check if this notification type is enabled
      if (!this.isNotificationTypeEnabled(notification.type, preferences)) {
        this.logger.debug(
          `Notification type ${notification.type} disabled for user ${userId}`,
        );
        return;
      }

      // Get user email
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user || !user.email) {
        this.logger.warn(`User ${userId} not found or has no email address`);
        return;
      }

      // Create email message
      const emailMessage = new EmailMessage(
        [user.email],
        'noreply@kanbanboard.app',
        notification.title,
        this.generateEmailHtml(notification),
        notification.message,
      );

      // Send email asynchronously (don't block notification creation)
      this.emailService
        .sendEmail(emailMessage)
        .then((result) => {
          if (result.success) {
            this.logger.log(
              `Email notification sent to ${user.email}: ${result.messageId}`,
            );
          } else {
            this.logger.error(
              `Failed to send email notification to ${user.email}: ${result.error}`,
            );
          }
        })
        .catch((error) => {
          this.logger.error(
            `Exception sending email notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        });
    } catch (error) {
      this.logger.error(
        `Error checking preferences or sending email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if a notification type is enabled in user preferences
   */
  private isNotificationTypeEnabled(
    type: NotificationType,
    preferences: NotificationPreferencesEntity,
  ): boolean {
    switch (type) {
      case NotificationType.CARD_ASSIGNED:
        return preferences.cardAssignmentEnabled;
      case NotificationType.CARD_COMMENT_ADDED:
        return preferences.commentEnabled;
      case NotificationType.CARD_DUE_SOON:
        return preferences.dueDateReminderEnabled;
      default:
        return true;
    }
  }

  /**
   * Generate HTML content for email notification
   * Uses simple inline HTML (will be replaced with templates in future)
   */
  private generateEmailHtml(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.data.cardTitle ? `<p><strong>Card:</strong> ${notification.data.cardTitle}</p>` : ''}
              ${notification.data.boardName ? `<p><strong>Board:</strong> ${notification.data.boardName}</p>` : ''}
            </div>
            <div class="footer">
              <p>You received this email because you have email notifications enabled.</p>
              <p><a href="${notification.data.actionUrl || '#'}">View in app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
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
