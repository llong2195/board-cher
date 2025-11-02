import { List } from './list.model';

/**
 * ListRepository Interface
 *
 * Defines the contract for List persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface IListRepository {
  /**
   * Find a list by ID
   */
  findById(id: string): Promise<List | null>;

  /**
   * Find all lists in a board
   */
  findByBoardId(boardId: string, includeArchived?: boolean): Promise<List[]>;

  /**
   * Find lists by board ID ordered by position
   */
  findByBoardIdOrdered(
    boardId: string,
    includeArchived?: boolean,
  ): Promise<List[]>;

  /**
   * Save a list (create or update)
   */
  save(list: List): Promise<List>;

  /**
   * Delete a list permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a list exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count lists in a board
   */
  countByBoardId(boardId: string): Promise<number>;

  /**
   * Get the next available position in a board
   */
  getNextPosition(boardId: string): Promise<number>;

  /**
   * Update positions for multiple lists (for reordering)
   */
  updatePositions(lists: { id: string; position: number }[]): Promise<void>;
}
