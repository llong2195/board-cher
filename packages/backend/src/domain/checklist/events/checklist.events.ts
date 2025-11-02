import { Checklist, ChecklistItem } from '../checklist.model';

/**
 * Base class for Checklist domain events
 */
export abstract class ChecklistEvent {
  constructor(
    public readonly checklistId: string,
    public readonly cardId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a checklist is created
 */
export class ChecklistCreatedEvent extends ChecklistEvent {
  constructor(
    public readonly checklist: Checklist,
    public readonly userId: string,
  ) {
    super(checklist.id, checklist.cardId);
  }
}

/**
 * Event emitted when a checklist is renamed
 */
export class ChecklistRenamedEvent extends ChecklistEvent {
  constructor(
    public readonly checklist: Checklist,
    public readonly oldName: string,
    public readonly userId: string,
  ) {
    super(checklist.id, checklist.cardId);
  }
}

/**
 * Event emitted when a checklist item is toggled
 */
export class ChecklistItemToggledEvent extends ChecklistEvent {
  constructor(
    checklistId: string,
    cardId: string,
    public readonly itemId: string,
    public readonly isCompleted: boolean,
    public readonly userId: string,
  ) {
    super(checklistId, cardId);
  }
}

/**
 * Event emitted when a checklist item is added
 */
export class ChecklistItemAddedEvent extends ChecklistEvent {
  constructor(
    checklistId: string,
    cardId: string,
    public readonly item: ChecklistItem,
    public readonly userId: string,
  ) {
    super(checklistId, cardId);
  }
}

/**
 * Event emitted when a checklist item is updated
 */
export class ChecklistItemUpdatedEvent extends ChecklistEvent {
  constructor(
    checklistId: string,
    cardId: string,
    public readonly item: ChecklistItem,
    public readonly oldText: string,
    public readonly userId: string,
  ) {
    super(checklistId, cardId);
  }
}

/**
 * Event emitted when a checklist item is deleted
 */
export class ChecklistItemDeletedEvent extends ChecklistEvent {
  constructor(
    checklistId: string,
    cardId: string,
    public readonly itemId: string,
    public readonly userId: string,
  ) {
    super(checklistId, cardId);
  }
}

/**
 * Event emitted when a checklist is deleted
 */
export class ChecklistDeletedEvent extends ChecklistEvent {
  constructor(
    checklistId: string,
    cardId: string,
    public readonly userId: string,
  ) {
    super(checklistId, cardId);
  }
}

/**
 * Event emitted when a checklist is completed (all items checked)
 */
export class ChecklistCompletedEvent extends ChecklistEvent {
  constructor(
    public readonly checklist: Checklist,
    public readonly userId: string,
  ) {
    super(checklist.id, checklist.cardId);
  }
}
