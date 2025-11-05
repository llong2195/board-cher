/**
 * Board Aggregate Root
 *
 * Implements DDD Aggregate pattern for Board entity.
 *
 * Responsibilities:
 * - Manage board properties (name, description, color)
 * - Control list lifecycle (add, remove, reorder)
 * - Enforce business rules and invariants
 * - Emit domain events for state changes
 * - Maintain transactional consistency boundary
 *
 * Aggregate boundary:
 * - Board (root)
 * - List (child entities)
 *
 * External references (by ID only):
 * - Organization
 * - Cards (managed by Card aggregate)
 */

import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '../shared/aggregate-root';
import { Board } from './board.model';
import { List } from '../list/list.model';
import { PositionCalculatorService } from '../shared/position-calculator.service';
import {
  ListAddedToBoardEvent,
  ListRemovedFromBoardEvent,
  ListMovedInBoardEvent,
  ListRenamedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
} from './events/board-aggregate.events';

const MAX_LISTS_PER_BOARD = 50;

export class BoardAggregate extends AggregateRoot {
  private constructor(
    private readonly board: Board,
    private lists: List[] = [],
    private readonly positionCalculator: PositionCalculatorService = new PositionCalculatorService(),
  ) {
    super();
  }

  /**
   * Factory method to create a new board aggregate
   */
  static create(
    organizationId: string,
    name: string,
    createdBy: string,
    description?: string,
    color?: string,
  ): BoardAggregate {
    const boardId = uuidv4();
    const board = Board.create(
      boardId,
      organizationId,
      name,
      createdBy,
      description,
      color,
    );

    return new BoardAggregate(board, []);
  }

  /**
   * Reconstitute aggregate from persistence
   */
  static reconstitute(board: Board, lists: List[]): BoardAggregate {
    const aggregate = new BoardAggregate(board, lists);
    return aggregate;
  }

  /**
   * Add a new list to the board
   */
  addList(name: string, userId: string, position?: number): List {
    // Enforce business rule: max lists per board
    if (this.lists.length >= MAX_LISTS_PER_BOARD) {
      throw new Error(
        `Board cannot have more than ${MAX_LISTS_PER_BOARD} lists`,
      );
    }

    // Calculate position if not provided
    const listPosition =
      position ??
      this.positionCalculator.calculateInsertPosition(
        this.lists,
        this.lists.length + 1,
      );

    // Create the list
    const listId = uuidv4();
    const list = List.create(listId, this.board.id, name, listPosition);

    // Add to collection
    this.lists.push(list);

    // Recalculate positions if needed
    if (position !== undefined && position < this.lists.length) {
      const updated = this.positionCalculator.recalculateAfterInsert(
        this.lists.filter((l) => l.id !== listId),
        listPosition,
      );
      this.lists = updated.concat(list);
    }

    // Update board timestamp
    this.board.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new ListAddedToBoardEvent(
        this.board.id,
        listId,
        name,
        listPosition,
        userId,
      ),
    );

    return list;
  }

  /**
   * Remove a list from the board
   */
  removeList(listId: string, userId: string): void {
    const listIndex = this.lists.findIndex((l) => l.id === listId);
    if (listIndex === -1) {
      throw new Error(`List with ID ${listId} not found in board`);
    }

    const removedList = this.lists[listIndex];

    // Remove from collection
    this.lists.splice(listIndex, 1);

    // Recalculate positions for remaining lists
    this.lists = this.positionCalculator.recalculateAfterDelete(
      this.lists,
      removedList.position,
    );

    // Update board timestamp
    this.board.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new ListRemovedFromBoardEvent(this.board.id, listId, userId),
    );
  }

  /**
   * Move a list to a new position
   */
  moveList(listId: string, newPosition: number, userId: string): void {
    const list = this.lists.find((l) => l.id === listId);
    if (!list) {
      throw new Error(`List with ID ${listId} not found in board`);
    }

    if (newPosition < 1 || newPosition > this.lists.length) {
      throw new Error(`Invalid position: ${newPosition}`);
    }

    const oldPosition = list.position;

    if (oldPosition === newPosition) {
      return; // No change needed
    }

    // Recalculate positions for all lists
    this.lists = this.positionCalculator.recalculateAfterMove(
      this.lists,
      listId,
      oldPosition,
      newPosition,
    );

    // Update board timestamp
    this.board.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new ListMovedInBoardEvent(
        this.board.id,
        listId,
        oldPosition,
        newPosition,
        userId,
      ),
    );
  }

  /**
   * Rename a list
   */
  renameList(listId: string, newName: string, userId: string): void {
    const list = this.lists.find((l) => l.id === listId);
    if (!list) {
      throw new Error(`List with ID ${listId} not found in board`);
    }

    if (!newName || newName.trim().length === 0) {
      throw new Error('List name cannot be empty');
    }

    if (newName.length > 255) {
      throw new Error('List name cannot exceed 255 characters');
    }

    const oldName = list.name;
    list.name = newName;
    list.updatedAt = new Date();

    // Update board timestamp
    this.board.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new ListRenamedEvent(this.board.id, listId, oldName, newName, userId),
    );
  }

  /**
   * Update board properties
   */
  updateBoard(
    changes: {
      name?: string;
      description?: string;
      color?: string;
    },
    userId: string,
  ): void {
    if (changes.name !== undefined) {
      if (!changes.name || changes.name.trim().length === 0) {
        throw new Error('Board name cannot be empty');
      }
      if (changes.name.length > 255) {
        throw new Error('Board name cannot exceed 255 characters');
      }
      this.board.name = changes.name;
    }

    if (changes.description !== undefined) {
      this.board.description = changes.description || null;
    }

    if (changes.color !== undefined) {
      this.board.color = changes.color || null;
    }

    this.board.updatedAt = new Date();

    this.addDomainEvent(new BoardUpdatedEvent(this.board.id, changes, userId));
  }

  /**
   * Archive the board (soft delete)
   */
  archive(userId: string): void {
    this.board.isArchived = true;
    this.board.updatedAt = new Date();

    this.addDomainEvent(new BoardArchivedEvent(this.board.id, userId));
  }

  /**
   * Getters with defensive copying
   */
  getBoard(): Board {
    return this.board;
  }

  getLists(): ReadonlyArray<List> {
    return Object.freeze([...this.lists]);
  }

  getListById(listId: string): List | undefined {
    return this.lists.find((l) => l.id === listId);
  }

  getListCount(): number {
    return this.lists.length;
  }

  /**
   * Validation helpers
   */
  canAddMoreLists(): boolean {
    return this.lists.length < MAX_LISTS_PER_BOARD;
  }

  hasLists(): boolean {
    return this.lists.length > 0;
  }

  /**
   * Get aggregate ID
   */
  get id(): string {
    return this.board.id;
  }

  get organizationId(): string {
    return this.board.organizationId;
  }
}
