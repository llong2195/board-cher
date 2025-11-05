/**
 * Card Aggregate Repository Interface
 *
 * Defines the contract for persisting and retrieving Card aggregates.
 * Follows Repository pattern from DDD.
 */

import { CardAggregate } from './card-aggregate';

export interface ICardAggregateRepository {
  /**
   * Find a card aggregate by ID
   * Fully hydrates all child entities (comments, checklists, attachments, etc.)
   * Returns null if not found
   */
  findById(cardId: string): Promise<CardAggregate | null>;

  /**
   * Save a card aggregate (create or update)
   * Persists all child entities within a transaction
   * Publishes any pending domain events
   */
  save(aggregate: CardAggregate): Promise<void>;

  /**
   * Delete a card aggregate
   * Cascades to all child entities
   */
  delete(cardId: string): Promise<void>;

  /**
   * Find all cards in a list
   */
  findByListId(listId: string): Promise<CardAggregate[]>;

  /**
   * Find all cards assigned to a user
   */
  findByAssignee(userId: string): Promise<CardAggregate[]>;

  /**
   * Check if a card exists
   */
  exists(cardId: string): Promise<boolean>;
}
