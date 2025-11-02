import { List } from '../list.model';

/**
 * Base class for List domain events
 */
export abstract class ListEvent {
  constructor(
    public readonly listId: string,
    public readonly boardId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a list is created
 */
export class ListCreatedEvent extends ListEvent {
  constructor(
    public readonly list: List,
    public readonly userId: string,
  ) {
    super(list.id, list.boardId);
  }
}

/**
 * Event emitted when a list is updated
 */
export class ListUpdatedEvent extends ListEvent {
  constructor(
    public readonly list: List,
    public readonly userId: string,
    public readonly changes: Partial<List>,
  ) {
    super(list.id, list.boardId);
  }
}

/**
 * Event emitted when a list is moved to a new position
 */
export class ListMovedEvent extends ListEvent {
  constructor(
    public readonly list: List,
    public readonly userId: string,
    public readonly oldPosition: number,
    public readonly newPosition: number,
  ) {
    super(list.id, list.boardId);
  }
}

/**
 * Event emitted when a list is deleted
 */
export class ListDeletedEvent extends ListEvent {
  constructor(
    listId: string,
    boardId: string,
    public readonly userId: string,
  ) {
    super(listId, boardId);
  }
}

/**
 * Event emitted when a list is archived
 */
export class ListArchivedEvent extends ListEvent {
  constructor(
    public readonly list: List,
    public readonly userId: string,
  ) {
    super(list.id, list.boardId);
  }
}

/**
 * Event emitted when a list is restored from archive
 */
export class ListRestoredEvent extends ListEvent {
  constructor(
    public readonly list: List,
    public readonly userId: string,
  ) {
    super(list.id, list.boardId);
  }
}
