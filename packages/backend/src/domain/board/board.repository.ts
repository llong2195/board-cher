import { Board } from './board.model';

/**
 * BoardRepository Interface
 *
 * Defines the contract for Board persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface IBoardRepository {
  /**
   * Find a board by ID
   */
  findById(id: string): Promise<Board | null>;

  /**
   * Find all boards in an organization
   */
  findByOrganizationId(
    organizationId: string,
    includeArchived?: boolean,
  ): Promise<Board[]>;

  /**
   * Find boards accessible by a specific user
   */
  findByUserId(userId: string, includeArchived?: boolean): Promise<Board[]>;

  /**
   * Save a board (create or update)
   */
  save(board: Board): Promise<Board>;

  /**
   * Delete a board permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a board exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count boards in an organization
   */
  countByOrganizationId(organizationId: string): Promise<number>;

  /**
   * Find boards with pagination
   */
  findWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    includeArchived?: boolean,
  ): Promise<{ boards: Board[]; total: number }>;
}
