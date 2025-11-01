import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Domain Event Emitter
 * Publishes domain events that can be subscribed to by infrastructure layer
 * Follows Domain-Driven Design event-driven architecture pattern
 */
@Injectable()
export class DomainEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit a domain event
   * @param eventName - The name of the domain event
   * @param payload - The event payload data
   */
  emit<T = any>(eventName: string, payload: T): void {
    this.eventEmitter.emit(eventName, payload);
  }

  /**
   * Emit multiple domain events
   * @param events - Array of events with name and payload
   */
  emitAll(events: Array<{ name: string; payload: any }>): void {
    events.forEach((event) => {
      this.emit(event.name, event.payload);
    });
  }
}

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  aggregateId: string;
  userId?: string;
}

/**
 * Board domain events
 */
export interface BoardCreatedEvent extends DomainEvent {
  eventName: 'board.created';
  boardId: string;
  organizationId: string;
  name: string;
  createdBy: string;
}

export interface BoardUpdatedEvent extends DomainEvent {
  eventName: 'board.updated';
  boardId: string;
  changes: Partial<{
    name: string;
    description: string;
    color: string;
  }>;
  updatedBy: string;
}

export interface BoardDeletedEvent extends DomainEvent {
  eventName: 'board.deleted';
  boardId: string;
  deletedBy: string;
}

export interface BoardArchivedEvent extends DomainEvent {
  eventName: 'board.archived';
  boardId: string;
  archivedBy: string;
}

/**
 * List domain events
 */
export interface ListCreatedEvent extends DomainEvent {
  eventName: 'list.created';
  listId: string;
  boardId: string;
  name: string;
  position: number;
  createdBy: string;
}

export interface ListUpdatedEvent extends DomainEvent {
  eventName: 'list.updated';
  listId: string;
  boardId: string;
  changes: Partial<{
    name: string;
  }>;
  updatedBy: string;
}

export interface ListMovedEvent extends DomainEvent {
  eventName: 'list.moved';
  listId: string;
  boardId: string;
  oldPosition: number;
  newPosition: number;
  movedBy: string;
}

export interface ListDeletedEvent extends DomainEvent {
  eventName: 'list.deleted';
  listId: string;
  boardId: string;
  deletedBy: string;
}

export interface ListArchivedEvent extends DomainEvent {
  eventName: 'list.archived';
  listId: string;
  boardId: string;
  archivedBy: string;
}

/**
 * Card domain events
 */
export interface CardCreatedEvent extends DomainEvent {
  eventName: 'card.created';
  cardId: string;
  listId: string;
  boardId: string;
  title: string;
  position: number;
  createdBy: string;
}

export interface CardUpdatedEvent extends DomainEvent {
  eventName: 'card.updated';
  cardId: string;
  listId: string;
  boardId: string;
  changes: Partial<{
    title: string;
    description: string;
    dueDate: Date;
  }>;
  updatedBy: string;
}

export interface CardMovedEvent extends DomainEvent {
  eventName: 'card.moved';
  cardId: string;
  boardId: string;
  oldListId: string;
  newListId: string;
  oldPosition: number;
  newPosition: number;
  movedBy: string;
}

export interface CardDeletedEvent extends DomainEvent {
  eventName: 'card.deleted';
  cardId: string;
  listId: string;
  boardId: string;
  deletedBy: string;
}

export interface CardArchivedEvent extends DomainEvent {
  eventName: 'card.archived';
  cardId: string;
  listId: string;
  boardId: string;
  archivedBy: string;
}

/**
 * Comment domain events
 */
export interface CommentAddedEvent extends DomainEvent {
  eventName: 'comment.added';
  commentId: string;
  cardId: string;
  boardId: string;
  content: string;
  addedBy: string;
}

export interface CommentEditedEvent extends DomainEvent {
  eventName: 'comment.edited';
  commentId: string;
  cardId: string;
  boardId: string;
  content: string;
  editedBy: string;
}

export interface CommentDeletedEvent extends DomainEvent {
  eventName: 'comment.deleted';
  commentId: string;
  cardId: string;
  boardId: string;
  deletedBy: string;
}

/**
 * Attachment domain events
 */
export interface AttachmentUploadedEvent extends DomainEvent {
  eventName: 'attachment.uploaded';
  attachmentId: string;
  cardId: string;
  boardId: string;
  filename: string;
  fileSize: number;
  uploadedBy: string;
}

export interface AttachmentDeletedEvent extends DomainEvent {
  eventName: 'attachment.deleted';
  attachmentId: string;
  cardId: string;
  boardId: string;
  deletedBy: string;
}

/**
 * Label domain events
 */
export interface LabelCreatedEvent extends DomainEvent {
  eventName: 'label.created';
  labelId: string;
  boardId: string;
  name: string;
  color: string;
  createdBy: string;
}

export interface LabelAppliedEvent extends DomainEvent {
  eventName: 'label.applied';
  labelId: string;
  cardId: string;
  boardId: string;
  appliedBy: string;
}

export interface LabelRemovedEvent extends DomainEvent {
  eventName: 'label.removed';
  labelId: string;
  cardId: string;
  boardId: string;
  removedBy: string;
}

/**
 * Checklist domain events
 */
export interface ChecklistCreatedEvent extends DomainEvent {
  eventName: 'checklist.created';
  checklistId: string;
  cardId: string;
  boardId: string;
  title: string;
  createdBy: string;
}

export interface ChecklistItemToggledEvent extends DomainEvent {
  eventName: 'checklist.item.toggled';
  checklistId: string;
  itemId: string;
  cardId: string;
  boardId: string;
  isCompleted: boolean;
  toggledBy: string;
}

/**
 * Assignment domain events
 */
export interface MemberAssignedEvent extends DomainEvent {
  eventName: 'member.assigned';
  cardId: string;
  boardId: string;
  assigneeId: string;
  assignedBy: string;
}

export interface MemberUnassignedEvent extends DomainEvent {
  eventName: 'member.unassigned';
  cardId: string;
  boardId: string;
  assigneeId: string;
  unassignedBy: string;
}

/**
 * Due date domain events
 */
export interface DueDateSetEvent extends DomainEvent {
  eventName: 'dueDate.set';
  cardId: string;
  boardId: string;
  dueDate: Date;
  setBy: string;
}

export interface DueDateRemovedEvent extends DomainEvent {
  eventName: 'dueDate.removed';
  cardId: string;
  boardId: string;
  removedBy: string;
}
