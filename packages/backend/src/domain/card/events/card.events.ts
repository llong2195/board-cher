import { Card } from '../card.model';

/**
 * Base class for Card domain events
 */
export abstract class CardEvent {
  constructor(
    public readonly cardId: string,
    public readonly listId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a card is created
 */
export class CardCreatedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * Event emitted when a card is updated
 */
export class CardUpdatedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
    public readonly changes: Partial<Card>,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * Event emitted when a card is moved to a different list or position
 */
export class CardMovedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
    public readonly oldListId: string,
    public readonly oldPosition: number,
    public readonly newListId: string,
    public readonly newPosition: number,
  ) {
    super(card.id, newListId);
  }
}

/**
 * Event emitted when a card is deleted
 */
export class CardDeletedEvent extends CardEvent {
  constructor(
    cardId: string,
    listId: string,
    public readonly userId: string,
  ) {
    super(cardId, listId);
  }
}

/**
 * Event emitted when a card is archived
 */
export class CardArchivedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * Event emitted when a card is restored from archive
 */
export class CardRestoredEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * Event emitted when a due date is set or changed
 */
export class CardDueDateChangedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly userId: string,
    public readonly oldDueDate: Date | null,
    public readonly newDueDate: Date | null,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * T209 - US6: Event emitted when a user is assigned to a card
 */
export class CardAssignedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly assignedUserId: string,
    public readonly assignedBy: string,
  ) {
    super(card.id, card.listId);
  }
}

/**
 * T209 - US6: Event emitted when a user is unassigned from a card
 */
export class CardUnassignedEvent extends CardEvent {
  constructor(
    public readonly card: Card,
    public readonly unassignedUserId: string,
    public readonly unassignedBy: string,
  ) {
    super(card.id, card.listId);
  }
}
