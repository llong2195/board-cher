import { Injectable, Logger } from '@nestjs/common';
import { BoardGateway } from './board.gateway';
import {
  BoardCreatedEvent,
  BoardUpdatedEvent,
  ListCreatedEvent,
  ListMovedEvent,
  CardCreatedEvent,
  CardUpdatedEvent,
  CardMovedEvent,
  CommentAddedEvent,
  AttachmentUploadedEvent,
  LabelAppliedEvent,
  ChecklistItemToggledEvent,
  MemberAssignedEvent,
} from '../../domain/shared/domain-event.emitter';
import { WS_EVENTS } from '@trello-vibe/shared';

/**
 * WebSocket Event Publisher Service
 * Bridges domain events to WebSocket broadcasts
 * Translates domain events into WebSocket messages for real-time updates
 */
@Injectable()
export class WebSocketEventPublisherService {
  private readonly logger = new Logger(WebSocketEventPublisherService.name);

  constructor(private readonly boardGateway: BoardGateway) {}

  private handleError(operation: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to ${operation}: ${errorMessage}`);
  }

  publishBoardCreated(event: BoardCreatedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.BOARD_CREATED,
        {
          boardId: event.boardId,
          organizationId: event.organizationId,
          name: event.name,
          createdBy: event.createdBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published board created event: ${event.boardId}`);
    } catch (error: unknown) {
      this.handleError('publish board created event', error);
    }
  }

  publishBoardUpdated(event: BoardUpdatedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.BOARD_UPDATED,
        {
          boardId: event.boardId,
          changes: event.changes,
          updatedBy: event.updatedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published board updated event: ${event.boardId}`);
    } catch (error: unknown) {
      this.handleError('publish board updated event', error);
    }
  }

  publishListCreated(event: ListCreatedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.LIST_CREATED,
        {
          listId: event.listId,
          boardId: event.boardId,
          name: event.name,
          position: event.position,
          createdBy: event.createdBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published list created event: ${event.listId}`);
    } catch (error: unknown) {
      this.handleError('publish list created event', error);
    }
  }

  publishListMoved(event: ListMovedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(event.boardId, WS_EVENTS.LIST_MOVED, {
        listId: event.listId,
        boardId: event.boardId,
        oldPosition: event.oldPosition,
        newPosition: event.newPosition,
        movedBy: event.movedBy,
        occurredAt: event.occurredAt,
      });
      this.logger.log(`Published list moved event: ${event.listId}`);
    } catch (error: unknown) {
      this.handleError('publish list moved event', error);
    }
  }

  publishCardCreated(event: CardCreatedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.CARD_CREATED,
        {
          cardId: event.cardId,
          listId: event.listId,
          boardId: event.boardId,
          title: event.title,
          position: event.position,
          createdBy: event.createdBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published card created event: ${event.cardId}`);
    } catch (error: unknown) {
      this.handleError('publish card created event', error);
    }
  }

  publishCardMoved(event: CardMovedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(event.boardId, WS_EVENTS.CARD_MOVED, {
        cardId: event.cardId,
        boardId: event.boardId,
        oldListId: event.oldListId,
        newListId: event.newListId,
        oldPosition: event.oldPosition,
        newPosition: event.newPosition,
        movedBy: event.movedBy,
        occurredAt: event.occurredAt,
      });
      this.logger.log(`Published card moved event: ${event.cardId}`);
    } catch (error: unknown) {
      this.handleError('publish card moved event', error);
    }
  }

  publishCardUpdated(event: CardUpdatedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.CARD_UPDATED,
        {
          cardId: event.cardId,
          listId: event.listId,
          boardId: event.boardId,
          changes: event.changes,
          updatedBy: event.updatedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published card updated event: ${event.cardId}`);
    } catch (error: unknown) {
      this.handleError('publish card updated event', error);
    }
  }

  publishCommentAdded(event: CommentAddedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.COMMENT_ADDED,
        {
          commentId: event.commentId,
          cardId: event.cardId,
          boardId: event.boardId,
          content: event.content,
          addedBy: event.addedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published comment added event: ${event.commentId}`);
    } catch (error: unknown) {
      this.handleError('publish comment added event', error);
    }
  }

  publishAttachmentUploaded(event: AttachmentUploadedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.ATTACHMENT_ADDED,
        {
          attachmentId: event.attachmentId,
          cardId: event.cardId,
          boardId: event.boardId,
          filename: event.filename,
          fileSize: event.fileSize,
          uploadedBy: event.uploadedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(
        `Published attachment uploaded event: ${event.attachmentId}`,
      );
    } catch (error: unknown) {
      this.handleError('publish attachment uploaded event', error);
    }
  }

  publishLabelApplied(event: LabelAppliedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.LABEL_APPLIED,
        {
          labelId: event.labelId,
          cardId: event.cardId,
          boardId: event.boardId,
          appliedBy: event.appliedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published label applied event: ${event.labelId}`);
    } catch (error: unknown) {
      this.handleError('publish label applied event', error);
    }
  }

  publishMemberAssigned(event: MemberAssignedEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.CARD_ASSIGNED,
        {
          cardId: event.cardId,
          boardId: event.boardId,
          assigneeId: event.assigneeId,
          assignedBy: event.assignedBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published member assigned event: ${event.cardId}`);
    } catch (error: unknown) {
      this.handleError('publish member assigned event', error);
    }
  }

  publishChecklistItemToggled(event: ChecklistItemToggledEvent): void {
    try {
      this.boardGateway.broadcastToBoard(
        event.boardId,
        WS_EVENTS.CHECKLIST_ITEM_TOGGLED,
        {
          checklistId: event.checklistId,
          itemId: event.itemId,
          cardId: event.cardId,
          boardId: event.boardId,
          isCompleted: event.isCompleted,
          toggledBy: event.toggledBy,
          occurredAt: event.occurredAt,
        },
      );
      this.logger.log(`Published checklist toggled event: ${event.itemId}`);
    } catch (error: unknown) {
      this.handleError('publish checklist toggled event', error);
    }
  }
}
