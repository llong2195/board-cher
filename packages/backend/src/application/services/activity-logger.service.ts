/**
 * T251 + T263 - ActivityLogger Service
 * User Story 7: Activity History and Audit Trail
 *
 * Service that subscribes to ALL domain events and creates activity records.
 * Provides automatic audit logging for all actions in the system.
 * Also broadcasts activity updates via WebSocket for real-time feeds.
 *
 * Implementation:
 * - Listens to domain events using @OnEvent decorators
 * - Maps events to Activity entities
 * - Persists activities via ActivityRepository
 * - Broadcasts to WebSocket clients for real-time updates
 * - Provides centralized audit trail
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BoardGateway } from '../../infrastructure/websocket/board.gateway';
import {
  AttachmentDeletedEvent,
  AttachmentUploadedEvent,
  BoardArchivedEvent,
  BoardCreatedEvent,
  BoardDeletedEvent,
  BoardUpdatedEvent,
  CardArchivedEvent,
  CardCreatedEvent,
  CardDeletedEvent,
  CardMovedEvent,
  CardUpdatedEvent,
  ChecklistCreatedEvent,
  ChecklistItemToggledEvent,
  CommentAddedEvent,
  CommentDeletedEvent,
  CommentEditedEvent,
  DueDateRemovedEvent,
  DueDateSetEvent,
  LabelAppliedEvent,
  LabelCreatedEvent,
  LabelRemovedEvent,
  ListArchivedEvent,
  ListCreatedEvent,
  ListDeletedEvent,
  ListMovedEvent,
  ListUpdatedEvent,
  MemberAssignedEvent,
  MemberUnassignedEvent,
} from '../../domain/shared/domain-event.emitter';
import {
  ActivityActionType,
  ActivityEntity,
  ActivityEntityType,
} from '../../infrastructure/persistence/entities/activity.entity';

@Injectable()
export class ActivityLoggerService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
    private readonly boardGateway: BoardGateway,
  ) {}

  // ===== BOARD EVENTS =====

  @OnEvent('board.created')
  async handleBoardCreated(event: BoardCreatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.createdBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.BOARD_CREATED,
      entityType: ActivityEntityType.BOARD,
      entityId: event.boardId,
      metadata: {
        name: event.name,
        organizationId: event.organizationId,
      },
    });
  }

  @OnEvent('board.updated')
  async handleBoardUpdated(event: BoardUpdatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.updatedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.BOARD_UPDATED,
      entityType: ActivityEntityType.BOARD,
      entityId: event.boardId,
      metadata: {
        changes: event.changes,
      },
    });
  }

  @OnEvent('board.deleted')
  async handleBoardDeleted(event: BoardDeletedEvent): Promise<void> {
    await this.createActivity({
      userId: event.deletedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.BOARD_DELETED,
      entityType: ActivityEntityType.BOARD,
      entityId: event.boardId,
      metadata: null,
    });
  }

  @OnEvent('board.archived')
  async handleBoardArchived(event: BoardArchivedEvent): Promise<void> {
    await this.createActivity({
      userId: event.archivedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.BOARD_ARCHIVED,
      entityType: ActivityEntityType.BOARD,
      entityId: event.boardId,
      metadata: null,
    });
  }

  // ===== LIST EVENTS =====

  @OnEvent('list.created')
  async handleListCreated(event: ListCreatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.createdBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LIST_CREATED,
      entityType: ActivityEntityType.LIST,
      entityId: event.listId,
      metadata: {
        name: event.name,
        position: event.position,
      },
    });
  }

  @OnEvent('list.updated')
  async handleListUpdated(event: ListUpdatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.updatedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LIST_UPDATED,
      entityType: ActivityEntityType.LIST,
      entityId: event.listId,
      metadata: {
        changes: event.changes,
      },
    });
  }

  @OnEvent('list.moved')
  async handleListMoved(event: ListMovedEvent): Promise<void> {
    await this.createActivity({
      userId: event.movedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LIST_MOVED,
      entityType: ActivityEntityType.LIST,
      entityId: event.listId,
      metadata: {
        from: event.oldPosition,
        to: event.newPosition,
      },
    });
  }

  @OnEvent('list.deleted')
  async handleListDeleted(event: ListDeletedEvent): Promise<void> {
    await this.createActivity({
      userId: event.deletedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LIST_DELETED,
      entityType: ActivityEntityType.LIST,
      entityId: event.listId,
      metadata: null,
    });
  }

  @OnEvent('list.archived')
  async handleListArchived(event: ListArchivedEvent): Promise<void> {
    await this.createActivity({
      userId: event.archivedBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LIST_ARCHIVED,
      entityType: ActivityEntityType.LIST,
      entityId: event.listId,
      metadata: null,
    });
  }

  // ===== CARD EVENTS =====

  @OnEvent('card.created')
  async handleCardCreated(event: CardCreatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.createdBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CARD_CREATED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: {
        name: event.title,
        listId: event.listId,
      },
    });
  }

  @OnEvent('card.updated')
  async handleCardUpdated(event: CardUpdatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.updatedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CARD_UPDATED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: {
        changes: event.changes,
      },
    });
  }

  @OnEvent('card.moved')
  async handleCardMoved(event: CardMovedEvent): Promise<void> {
    await this.createActivity({
      userId: event.movedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CARD_MOVED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: {
        oldListId: event.oldListId,
        newListId: event.newListId,
        from: event.oldPosition,
        to: event.newPosition,
      },
    });
  }

  @OnEvent('card.deleted')
  async handleCardDeleted(event: CardDeletedEvent): Promise<void> {
    await this.createActivity({
      userId: event.deletedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CARD_DELETED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: null,
    });
  }

  @OnEvent('card.archived')
  async handleCardArchived(event: CardArchivedEvent): Promise<void> {
    await this.createActivity({
      userId: event.archivedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CARD_ARCHIVED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: null,
    });
  }

  // ===== COMMENT EVENTS =====

  @OnEvent('comment.added')
  async handleCommentAdded(event: CommentAddedEvent): Promise<void> {
    await this.createActivity({
      userId: event.addedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.COMMENT_ADDED,
      entityType: ActivityEntityType.COMMENT,
      entityId: event.commentId,
      metadata: {
        preview: event.content.substring(0, 100),
      },
    });
  }

  @OnEvent('comment.edited')
  async handleCommentEdited(event: CommentEditedEvent): Promise<void> {
    await this.createActivity({
      userId: event.editedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.COMMENT_EDITED,
      entityType: ActivityEntityType.COMMENT,
      entityId: event.commentId,
      metadata: null,
    });
  }

  @OnEvent('comment.deleted')
  async handleCommentDeleted(event: CommentDeletedEvent): Promise<void> {
    await this.createActivity({
      userId: event.deletedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.COMMENT_DELETED,
      entityType: ActivityEntityType.COMMENT,
      entityId: event.commentId,
      metadata: null,
    });
  }

  // ===== ATTACHMENT EVENTS =====

  @OnEvent('attachment.uploaded')
  async handleAttachmentUploaded(
    event: AttachmentUploadedEvent,
  ): Promise<void> {
    await this.createActivity({
      userId: event.uploadedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.ATTACHMENT_ADDED,
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: event.attachmentId,
      metadata: {
        filename: event.filename,
        fileSize: event.fileSize,
      },
    });
  }

  @OnEvent('attachment.deleted')
  async handleAttachmentDeleted(event: AttachmentDeletedEvent): Promise<void> {
    await this.createActivity({
      userId: event.deletedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.ATTACHMENT_DELETED,
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: event.attachmentId,
      metadata: null,
    });
  }

  // ===== LABEL EVENTS =====

  @OnEvent('label.created')
  async handleLabelCreated(event: LabelCreatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.createdBy,
      boardId: event.boardId,
      cardId: null,
      actionType: ActivityActionType.LABEL_CREATED,
      entityType: ActivityEntityType.LABEL,
      entityId: event.labelId,
      metadata: {
        name: event.name,
        color: event.color,
      },
    });
  }

  @OnEvent('label.applied')
  async handleLabelApplied(event: LabelAppliedEvent): Promise<void> {
    await this.createActivity({
      userId: event.appliedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.LABEL_ADDED,
      entityType: ActivityEntityType.LABEL,
      entityId: event.labelId,
      metadata: null,
    });
  }

  @OnEvent('label.removed')
  async handleLabelRemoved(event: LabelRemovedEvent): Promise<void> {
    await this.createActivity({
      userId: event.removedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.LABEL_REMOVED,
      entityType: ActivityEntityType.LABEL,
      entityId: event.labelId,
      metadata: null,
    });
  }

  // ===== CHECKLIST EVENTS =====

  @OnEvent('checklist.created')
  async handleChecklistCreated(event: ChecklistCreatedEvent): Promise<void> {
    await this.createActivity({
      userId: event.createdBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.CHECKLIST_CREATED,
      entityType: ActivityEntityType.CHECKLIST,
      entityId: event.checklistId,
      metadata: {
        name: event.title,
      },
    });
  }

  @OnEvent('checklist.item.toggled')
  async handleChecklistItemToggled(
    event: ChecklistItemToggledEvent,
  ): Promise<void> {
    await this.createActivity({
      userId: event.toggledBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: event.isCompleted
        ? ActivityActionType.CHECKLIST_ITEM_CHECKED
        : ActivityActionType.CHECKLIST_ITEM_UNCHECKED,
      entityType: ActivityEntityType.CHECKLIST,
      entityId: event.itemId,
      metadata: {
        checklistId: event.checklistId,
        isCompleted: event.isCompleted,
      },
    });
  }

  // ===== ASSIGNMENT EVENTS =====

  @OnEvent('member.assigned')
  async handleMemberAssigned(event: MemberAssignedEvent): Promise<void> {
    await this.createActivity({
      userId: event.assignedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.MEMBER_ASSIGNED,
      entityType: ActivityEntityType.USER,
      entityId: event.assigneeId,
      metadata: {
        assigneeId: event.assigneeId,
      },
    });
  }

  @OnEvent('member.unassigned')
  async handleMemberUnassigned(event: MemberUnassignedEvent): Promise<void> {
    await this.createActivity({
      userId: event.unassignedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.MEMBER_UNASSIGNED,
      entityType: ActivityEntityType.USER,
      entityId: event.assigneeId,
      metadata: {
        assigneeId: event.assigneeId,
      },
    });
  }

  // ===== DUE DATE EVENTS =====

  @OnEvent('dueDate.set')
  async handleDueDateSet(event: DueDateSetEvent): Promise<void> {
    await this.createActivity({
      userId: event.setBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.DUE_DATE_SET,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: {
        dueDate: event.dueDate.toISOString(),
      },
    });
  }

  @OnEvent('dueDate.removed')
  async handleDueDateRemoved(event: DueDateRemovedEvent): Promise<void> {
    await this.createActivity({
      userId: event.removedBy,
      boardId: event.boardId,
      cardId: event.cardId,
      actionType: ActivityActionType.DUE_DATE_REMOVED,
      entityType: ActivityEntityType.CARD,
      entityId: event.cardId,
      metadata: null,
    });
  }

  // ===== HELPER METHODS =====

  /**
   * Create an activity record in the database and broadcast via WebSocket (T263)
   */
  private async createActivity(data: {
    userId: string;
    boardId: string | null;
    cardId: string | null;
    actionType: ActivityActionType;
    entityType: ActivityEntityType;
    entityId: string;
    metadata: Record<string, any> | null;
  }): Promise<void> {
    try {
      const activity = this.activityRepository.create({
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
      });

      const savedActivity = await this.activityRepository.save(activity);

      // T263: Broadcast activity to WebSocket clients for real-time updates
      if (data.boardId) {
        this.boardGateway.broadcastToBoard(data.boardId, 'activity:created', {
          activity: {
            id: savedActivity.id,
            userId: savedActivity.userId,
            boardId: savedActivity.boardId,
            cardId: savedActivity.cardId,
            actionType: savedActivity.actionType,
            entityType: savedActivity.entityType,
            entityId: savedActivity.entityId,
            metadata: savedActivity.metadata,
            createdAt: savedActivity.createdAt,
          },
        });
      }
    } catch (error) {
      // Log error but don't throw - activity logging should not break the main flow
      console.error('Failed to create activity record:', error);
    }
  }
}
