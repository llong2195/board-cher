/**
 * Board Aggregate Repository Interface
 *
 * Defines the contract for persisting and retrieving Board aggregates.
 * Follows Repository pattern from DDD.
 */

import { BoardAggregate } from './board-aggregate';

export interface IBoardAggregateRepository {
  /**
   * Find a board aggregate by ID
   * Returns null if not found
   */
  findById(boardId: string): Promise<BoardAggregate | null>;

  /**
   * Save a board aggregate (create or update)
   * Publishes any pending domain events
   */
  save(aggregate: BoardAggregate): Promise<void>;

  /**
   * Delete a board aggregate
   */
  delete(boardId: string): Promise<void>;

  /**
   * Find all boards for an organization
   */
  findByOrganizationId(organizationId: string): Promise<BoardAggregate[]>;

  /**
   * Check if a board exists
   */
  exists(boardId: string): Promise<boolean>;
}
