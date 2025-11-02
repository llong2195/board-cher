import { Card } from './card.model';

/**
 * CardRepository Interface
 *
 * Defines the contract for Card persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface ICardRepository {
  /**
   * Find a card by ID
   */
  findById(id: string): Promise<Card | null>;

  /**
   * Find all cards in a list
   */
  findByListId(listId: string, includeArchived?: boolean): Promise<Card[]>;

  /**
   * Find cards by list ID ordered by position
   */
  findByListIdOrdered(
    listId: string,
    includeArchived?: boolean,
  ): Promise<Card[]>;

  /**
   * Find cards assigned to a user
   */
  findByAssignedUserId(userId: string): Promise<Card[]>;

  /**
   * Find cards by due date range
   */
  findByDueDateRange(startDate: Date, endDate: Date): Promise<Card[]>;

  /**
   * Search cards by text (title and description)
   */
  search(boardId: string, searchText: string, limit?: number): Promise<Card[]>;

  /**
   * Save a card (create or update)
   */
  save(card: Card): Promise<Card>;

  /**
   * Delete a card permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a card exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count cards in a list
   */
  countByListId(listId: string): Promise<number>;

  /**
   * Get the next available position in a list
   */
  getNextPosition(listId: string): Promise<number>;

  /**
   * Update positions for multiple cards (for reordering)
   */
  updatePositions(cards: { id: string; position: number }[]): Promise<void>;

  /**
   * Move card to different list (with position update)
   */
  move(cardId: string, targetListId: string, position: number): Promise<Card>;
}
