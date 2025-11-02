import { Label } from '../label.model';

/**
 * Base class for Label domain events
 */
export abstract class LabelEvent {
  constructor(
    public readonly labelId: string,
    public readonly boardId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a label is created
 */
export class LabelCreatedEvent extends LabelEvent {
  constructor(
    public readonly label: Label,
    public readonly userId: string,
  ) {
    super(label.id, label.boardId);
  }
}

/**
 * Event emitted when a label is renamed
 */
export class LabelRenamedEvent extends LabelEvent {
  constructor(
    public readonly label: Label,
    public readonly oldName: string | null,
    public readonly userId: string,
  ) {
    super(label.id, label.boardId);
  }
}

/**
 * Event emitted when a label is applied to a card
 */
export class LabelAppliedEvent extends LabelEvent {
  constructor(
    labelId: string,
    boardId: string,
    public readonly cardId: string,
    public readonly userId: string,
  ) {
    super(labelId, boardId);
  }
}

/**
 * Event emitted when a label is removed from a card
 */
export class LabelRemovedEvent extends LabelEvent {
  constructor(
    labelId: string,
    boardId: string,
    public readonly cardId: string,
    public readonly userId: string,
  ) {
    super(labelId, boardId);
  }
}

/**
 * Event emitted when a label is deleted
 */
export class LabelDeletedEvent extends LabelEvent {
  constructor(
    labelId: string,
    boardId: string,
    public readonly userId: string,
  ) {
    super(labelId, boardId);
  }
}
