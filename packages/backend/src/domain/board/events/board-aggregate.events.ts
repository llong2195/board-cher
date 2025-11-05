/**
 * Domain Events for Board Aggregate
 *
 * These events represent state changes within the Board aggregate.
 * They are used for:
 * - Activity logging
 * - Real-time notifications via WebSocket
 * - Event-driven workflows
 * - Audit trails
 */

import { DomainEvent } from '../../shared/aggregate-root';

/**
 * Event raised when a new list is added to a board
 */
export class ListAddedToBoardEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly listId: string,
    public readonly listName: string,
    public readonly position: number,
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'ListAddedToBoard';
  }
}

/**
 * Event raised when a list is removed from a board
 */
export class ListRemovedFromBoardEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly listId: string,
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'ListRemovedFromBoard';
  }
}

/**
 * Event raised when a list is moved to a new position within a board
 */
export class ListMovedInBoardEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly listId: string,
    public readonly oldPosition: number,
    public readonly newPosition: number,
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'ListMovedInBoard';
  }
}

/**
 * Event raised when a list is renamed
 */
export class ListRenamedEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly listId: string,
    public readonly oldName: string,
    public readonly newName: string,
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'ListRenamed';
  }
}

/**
 * Event raised when board settings are updated
 */
export class BoardUpdatedEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly changes: {
      name?: string;
      description?: string;
      color?: string;
    },
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'BoardUpdated';
  }
}

/**
 * Event raised when a board is archived
 */
export class BoardArchivedEvent extends DomainEvent {
  constructor(
    boardId: string,
    public readonly userId: string,
  ) {
    super(boardId);
  }

  get eventName(): string {
    return 'BoardArchived';
  }
}
