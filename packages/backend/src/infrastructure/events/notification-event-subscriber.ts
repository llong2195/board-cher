/**
 * T214 - Notification Event Subscriber
 * User Story 6: Card Assignment and Notifications
 *
 * Subscribes to domain events and creates notifications for users
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NotificationService,
  NotificationType,
} from '../../application/services/notification.service';
import {
  CardAssignedEvent,
  CardUnassignedEvent,
} from '../../domain/card/events/card.events';
import { DataSource } from 'typeorm';
import { CardAssignmentEntity } from '../persistence/entities/card-assignment.entity';

@Injectable()
export class NotificationEventSubscriber {
  private readonly logger = new Logger(NotificationEventSubscriber.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Handle card assigned event - notify the assignee
   */
  @OnEvent('card.assigned')
  async handleCardAssigned(event: CardAssignedEvent): Promise<void> {
    this.logger.log(`Creating notification for card.assigned: ${event.cardId}`);

    try {
      // Get assigner user details
      const assignment = await this.dataSource
        .getRepository(CardAssignmentEntity)
        .findOne({
          where: {
            cardId: event.cardId,
            userId: event.assignedUserId,
          },
          relations: ['assignedByUser', 'card'],
        });

      if (!assignment) {
        this.logger.warn(`Assignment not found for card ${event.cardId}`);
        return;
      }

      // Create notification for the assignee
      const notification = await this.notificationService.createNotification(
        event.assignedUserId,
        NotificationType.CARD_ASSIGNED,
        'Card Assigned',
        `You have been assigned to "${event.card.title}"`,
        {
          cardId: event.cardId,
          cardTitle: event.card.title,
          assignedBy: event.assignedBy,
          assignedAt: assignment.assignedAt,
        },
      );

      this.logger.log(
        `Created notification ${notification.id} for user ${event.assignedUserId}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create notification for card.assigned: ${error}`,
        );
      } else {
        this.logger.error(
          `Failed to create notification for card.assigned: `,
          error,
        );
      }
    }
  }

  /**
   * Handle comment added event - notify all assignees of the card
   */
  @OnEvent('comment.added')
  async handleCommentAdded(event: any): Promise<void> {
    this.logger.log(`Checking for card assignees to notify: ${event.cardId}`);

    try {
      // Get all assignees of this card
      const assignments = await this.dataSource
        .getRepository(CardAssignmentEntity)
        .find({
          where: { cardId: event.cardId },
          relations: ['user'],
        });

      if (assignments.length === 0) {
        this.logger.debug(`No assignees found for card ${event.cardId}`);
        return;
      }

      // Create notification for each assignee (except the comment author)
      for (const assignment of assignments) {
        if (assignment.userId === event.userId) {
          // Don't notify the user who made the comment
          continue;
        }

        const notification = await this.notificationService.createNotification(
          assignment.userId,
          NotificationType.CARD_COMMENT_ADDED,
          'New Comment',
          `New comment on "${event.card?.title || 'a card'}" you're assigned to`,
          {
            cardId: event.cardId,
            commentId: event.commentId,
            commentAuthor: event.userId,
          },
        );

        this.logger.log(
          `Created comment notification ${notification.id} for user ${assignment.userId}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create notifications for comment.added: ${error}`,
        );
      } else {
        this.logger.error(
          `Failed to create notifications for comment.added: `,
          error,
        );
      }
    }
  }
}
