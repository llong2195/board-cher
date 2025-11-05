import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../services/email.service';
import { EmailMessage } from '../../domain/shared/value-objects/email-message.vo';
import { NotificationPreferencesEntity } from '../../infrastructure/persistence/entities/notification-preferences.entity';
import { UserEntity } from '../../infrastructure/persistence/entities/user.entity';
import { NotificationType } from '../services/notification.service';

/**
 * T375: NotificationEmailSubscriber
 *
 * Domain event subscriber that listens to notification events
 * and sends email notifications based on user preferences
 */

export interface NotificationCreatedEvent {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class NotificationEmailSubscriber {
  private readonly logger = new Logger(NotificationEmailSubscriber.name);

  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(NotificationPreferencesEntity)
    private readonly preferencesRepository: Repository<NotificationPreferencesEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Listen for notification.created events
   */
  @OnEvent('notification.created')
  async handleNotificationCreated(
    event: NotificationCreatedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Handling notification.created event for user ${event.userId}`,
    );

    try {
      // Get user preferences
      const preferences = await this.preferencesRepository.findOne({
        where: { userId: event.userId },
      });

      // Check if email notifications are enabled
      if (!preferences || !preferences.emailEnabled) {
        this.logger.debug(
          `Email notifications disabled for user ${event.userId}`,
        );
        return;
      }

      // Check if this notification type is enabled
      if (!this.isNotificationTypeEnabled(event.type, preferences)) {
        this.logger.debug(
          `Notification type ${event.type} disabled for user ${event.userId}`,
        );
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        this.logger.debug(
          `User ${event.userId} is in quiet hours, skipping email`,
        );
        return;
      }

      // Get user email
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
      });

      if (!user || !user.email) {
        this.logger.warn(
          `User ${event.userId} not found or has no email address`,
        );
        return;
      }

      // Send email notification
      await this.sendEmailNotification(user, event);
    } catch (error) {
      this.logger.error(
        `Error handling notification event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Send email notification to user
   */
  private async sendEmailNotification(
    user: UserEntity,
    event: NotificationCreatedEvent,
  ): Promise<void> {
    try {
      // Create email message
      const emailMessage = new EmailMessage(
        [user.email],
        'noreply@kanbanboard.app',
        event.title,
        this.generateEmailHtml(event, user),
        event.message,
      );

      // Send email
      const result = await this.emailService.sendEmail(emailMessage);

      if (result.success) {
        this.logger.log(
          `Email notification sent to ${user.email}: ${result.messageId}`,
        );
      } else {
        this.logger.error(
          `Failed to send email notification to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Exception sending email notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferencesEntity): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight

    // Parse quiet hours (format: "HH:MM")
    const startParts = preferences.quietHoursStart.split(':');
    const endParts = preferences.quietHoursEnd.split(':');

    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startMinutes > endMinutes) {
      return currentTime >= startMinutes || currentTime < endMinutes;
    }

    // Handle same-day quiet hours (e.g., 13:00 to 14:00)
    return currentTime >= startMinutes && currentTime < endMinutes;
  }

  /**
   * Generate HTML content for email notification
   * This is a basic implementation - in production, use template engine with .hbs files
   */
  private generateEmailHtml(
    event: NotificationCreatedEvent,
    user: UserEntity,
  ): string {
    const cardTitle = event.data.cardTitle as string | undefined;
    const boardName = event.data.boardName as string | undefined;
    const listName = event.data.listName as string | undefined;
    const actionUrl = event.data.actionUrl as string | undefined;
    const unsubscribeUrl = event.data.unsubscribeUrl as string | undefined;
    const preferencesUrl = event.data.preferencesUrl as string | undefined;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
              color: #333333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .notification-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .notification-title {
              font-size: 18px;
              font-weight: 600;
              color: #333333;
              margin-bottom: 10px;
            }
            .notification-message {
              font-size: 14px;
              color: #666666;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #667eea;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.getNotificationIcon(event.type)} ${event.title}</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              
              <div class="notification-box">
                <div class="notification-title">${event.type.replace(/_/g, ' ').toUpperCase()}</div>
                <div class="notification-message">${event.message}</div>
                
                ${cardTitle ? `<p style="margin-top: 15px;"><strong>Card:</strong> ${cardTitle}</p>` : ''}
                ${boardName ? `<p><strong>Board:</strong> ${boardName}</p>` : ''}
                ${listName ? `<p><strong>List:</strong> ${listName}</p>` : ''}
              </div>
              
              ${actionUrl ? `<center><a href="${actionUrl}" class="button">View Card</a></center>` : ''}
            </div>
            <div class="footer">
              <p>You received this email because you have email notifications enabled.</p>
              <p>
                <a href="${unsubscribeUrl || '#'}">Unsubscribe</a> •
                <a href="${preferencesUrl || '#'}">Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get emoji icon for notification type
   */
  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.CARD_ASSIGNED:
        return '📌';
      case NotificationType.CARD_COMMENT_ADDED:
        return '💬';
      case NotificationType.CARD_DUE_SOON:
        return '⏰';
      default:
        return '🔔';
    }
  }
}
