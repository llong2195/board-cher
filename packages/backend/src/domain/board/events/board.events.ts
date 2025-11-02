import { Board } from '../board.model';

/**
 * Base class for Board domain events
 */
export abstract class BoardEvent {
  constructor(
    public readonly boardId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event emitted when a board is created
 */
export class BoardCreatedEvent extends BoardEvent {
  constructor(
    public readonly board: Board,
    public readonly userId: string,
  ) {
    super(board.id);
  }
}

/**
 * Event emitted when a board is updated
 */
export class BoardUpdatedEvent extends BoardEvent {
  constructor(
    public readonly board: Board,
    public readonly userId: string,
    public readonly changes: Partial<Board>,
  ) {
    super(board.id);
  }
}

/**
 * Event emitted when a board is deleted
 */
export class BoardDeletedEvent extends BoardEvent {
  constructor(
    boardId: string,
    public readonly userId: string,
    public readonly organizationId: string,
  ) {
    super(boardId);
  }
}

/**
 * Event emitted when a board is archived
 */
export class BoardArchivedEvent extends BoardEvent {
  constructor(
    public readonly board: Board,
    public readonly userId: string,
  ) {
    super(board.id);
  }
}

/**
 * Event emitted when a board is restored from archive
 */
export class BoardRestoredEvent extends BoardEvent {
  constructor(
    public readonly board: Board,
    public readonly userId: string,
  ) {
    super(board.id);
  }
}
