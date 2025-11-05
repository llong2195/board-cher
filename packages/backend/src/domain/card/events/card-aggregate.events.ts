/**
 * Domain Events for Card Aggregate
 *
 * These events represent state changes within the Card aggregate.
 * Used for activity logging, real-time updates, and notifications.
 */

import { DomainEvent } from '../../shared/aggregate-root';

// Comment Events
export class CommentAddedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly commentId: string,
    public readonly content: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CommentAdded';
  }
}

export class CommentUpdatedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly commentId: string,
    public readonly newContent: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CommentUpdated';
  }
}

export class CommentDeletedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly commentId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CommentDeleted';
  }
}

// Checklist Events
export class ChecklistAddedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly checklistId: string,
    public readonly title: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'ChecklistAdded';
  }
}

export class ChecklistItemAddedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly checklistId: string,
    public readonly itemId: string,
    public readonly text: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'ChecklistItemAdded';
  }
}

export class ChecklistItemToggledEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly checklistId: string,
    public readonly itemId: string,
    public readonly isComplete: boolean,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'ChecklistItemToggled';
  }
}

export class ChecklistDeletedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly checklistId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'ChecklistDeleted';
  }
}

// Label Events
export class LabelAppliedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly labelId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'LabelApplied';
  }
}

export class LabelRemovedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly labelId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'LabelRemoved';
  }
}

// Assignment Events
export class UserAssignedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly userId: string,
    public readonly assignedBy: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'UserAssigned';
  }
}

export class UserUnassignedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly userId: string,
    public readonly unassignedBy: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'UserUnassigned';
  }
}

// Attachment Events
export class AttachmentAddedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly attachmentId: string,
    public readonly filename: string,
    public readonly size: number,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'AttachmentAdded';
  }
}

export class AttachmentRemovedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly attachmentId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'AttachmentRemoved';
  }
}

// Card Lifecycle Events
export class CardDetailsUpdatedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly changes: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
    },
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CardDetailsUpdated';
  }
}

export class CardMovedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly oldListId: string,
    public readonly newListId: string,
    public readonly oldPosition: number,
    public readonly newPosition: number,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CardMoved';
  }
}

export class CardArchivedEvent extends DomainEvent {
  constructor(
    cardId: string,
    public readonly userId: string,
  ) {
    super(cardId);
  }

  get eventName(): string {
    return 'CardArchived';
  }
}
