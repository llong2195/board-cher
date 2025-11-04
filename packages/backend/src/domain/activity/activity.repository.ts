import { Activity } from './activity.model';

/**
 * T250 - ActivityRepository Interface
 *
 * Defines the contract for Activity persistence operations.
 * Implementations will be in the infrastructure layer.
 *
 * Activities are immutable - only create and query operations are supported.
 * No update or delete operations (audit log integrity).
 */
export interface IActivityRepository {
  /**
   * Create a new activity record
   */
  create(activity: Activity): Promise<Activity>;

  /**
   * Find activity by ID
   */
  findById(id: string): Promise<Activity | null>;

  /**
   * Find all activities for a board (ordered by newest first)
   * @param boardId - Board ID to query
   * @param limit - Maximum number of activities to return
   * @param offset - Number of activities to skip
   */
  findByBoardId(
    boardId: string,
    limit?: number,
    offset?: number,
  ): Promise<Activity[]>;

  /**
   * Find all activities for a card (ordered by newest first)
   * @param cardId - Card ID to query
   * @param limit - Maximum number of activities to return
   * @param offset - Number of activities to skip
   */
  findByCardId(
    cardId: string,
    limit?: number,
    offset?: number,
  ): Promise<Activity[]>;

  /**
   * Find all activities by a user (ordered by newest first)
   * @param userId - User ID to query
   * @param limit - Maximum number of activities to return
   * @param offset - Number of activities to skip
   */
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Activity[]>;

  /**
   * Find activities for a specific entity (ordered by newest first)
   * @param entityType - Type of entity (BOARD, CARD, LIST, etc.)
   * @param entityId - Entity ID to query
   * @param limit - Maximum number of activities to return
   * @param offset - Number of activities to skip
   */
  findByEntity(
    entityType: string,
    entityId: string,
    limit?: number,
    offset?: number,
  ): Promise<Activity[]>;

  /**
   * Count total activities for a board
   */
  countByBoardId(boardId: string): Promise<number>;

  /**
   * Count total activities for a card
   */
  countByCardId(cardId: string): Promise<number>;

  /**
   * Get recent activities across all boards (for global feed)
   * @param limit - Maximum number of activities to return
   */
  findRecent(limit?: number): Promise<Activity[]>;
}
