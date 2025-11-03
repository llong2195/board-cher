import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketEventPublisherService } from './websocket-event-publisher.service';
import type {
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

/**
 * Domain Event Subscriber
 * Listens to domain events and broadcasts them via WebSocket
 * Maintains separation between domain layer and infrastructure layer
 */
@Injectable()
export class DomainEventSubscriber {
  private readonly logger = new Logger(DomainEventSubscriber.name);

  constructor(
    private readonly websocketEventPublisher: WebSocketEventPublisherService,
  ) {}

  @OnEvent('board.created')
  handleBoardCreated(event: BoardCreatedEvent): void {
    this.logger.log(`Received board.created event: ${event.boardId}`);
    this.websocketEventPublisher.publishBoardCreated(event);
  }

  @OnEvent('board.updated')
  handleBoardUpdated(event: BoardUpdatedEvent): void {
    this.logger.log(`Received board.updated event: ${event.boardId}`);
    this.websocketEventPublisher.publishBoardUpdated(event);
  }

  @OnEvent('list.created')
  handleListCreated(event: ListCreatedEvent): void {
    this.logger.log(`Received list.created event: ${event.listId}`);
    this.websocketEventPublisher.publishListCreated(event);
  }

  @OnEvent('list.moved')
  handleListMoved(event: ListMovedEvent): void {
    this.logger.log(`Received list.moved event: ${event.listId}`);
    this.websocketEventPublisher.publishListMoved(event);
  }

  @OnEvent('card.created')
  handleCardCreated(event: CardCreatedEvent): void {
    this.logger.log(`Received card.created event: ${event.cardId}`);
    this.websocketEventPublisher.publishCardCreated(event);
  }

  @OnEvent('card.moved')
  handleCardMoved(event: CardMovedEvent): void {
    this.logger.log(`Received card.moved event: ${event.cardId}`);
    this.websocketEventPublisher.publishCardMoved(event);
  }

  @OnEvent('card.updated')
  handleCardUpdated(event: CardUpdatedEvent): void {
    this.logger.log(`Received card.updated event: ${event.cardId}`);
    this.websocketEventPublisher.publishCardUpdated(event);
  }

  @OnEvent('comment.added')
  handleCommentAdded(event: CommentAddedEvent): void {
    this.logger.log(`Received comment.added event: ${event.commentId}`);
    this.websocketEventPublisher.publishCommentAdded(event);
  }

  @OnEvent('attachment.uploaded')
  handleAttachmentUploaded(event: AttachmentUploadedEvent): void {
    this.logger.log(
      `Received attachment.uploaded event: ${event.attachmentId}`,
    );
    this.websocketEventPublisher.publishAttachmentUploaded(event);
  }

  @OnEvent('label.applied')
  handleLabelApplied(event: LabelAppliedEvent): void {
    this.logger.log(`Received label.applied event: ${event.labelId}`);
    this.websocketEventPublisher.publishLabelApplied(event);
  }

  @OnEvent('member.assigned')
  handleMemberAssigned(event: MemberAssignedEvent): void {
    this.logger.log(`Received member.assigned event: ${event.cardId}`);
    this.websocketEventPublisher.publishMemberAssigned(event);
  }

  @OnEvent('checklist.item.toggled')
  handleChecklistItemToggled(event: ChecklistItemToggledEvent): void {
    this.logger.log(`Received checklist.item.toggled event: ${event.itemId}`);
    this.websocketEventPublisher.publishChecklistItemToggled(event);
  }

  // T214 - US6: Card Assignment Events
  @OnEvent('card.assigned')
  handleCardAssigned(event: any): void {
    this.logger.log(`Received card.assigned event: ${event.cardId}`);
    this.websocketEventPublisher.publishCardAssigned(event);
  }

  @OnEvent('card.unassigned')
  handleCardUnassigned(event: any): void {
    this.logger.log(`Received card.unassigned event: ${event.cardId}`);
    this.websocketEventPublisher.publishCardUnassigned(event);
  }
}
