import { Label } from './label.model';

/**
 * LabelRepository Interface
 *
 * Defines the contract for Label persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface ILabelRepository {
  /**
   * Find a label by ID
   */
  findById(id: string): Promise<Label | null>;

  /**
   * Find all labels for a board
   */
  findByBoardId(boardId: string): Promise<Label[]>;

  /**
   * Find labels applied to a card
   */
  findByCardId(cardId: string): Promise<Label[]>;

  /**
   * Find a label by board and name
   */
  findByBoardIdAndName(boardId: string, name: string): Promise<Label | null>;

  /**
   * Save a label (create or update)
   */
  save(label: Label): Promise<Label>;

  /**
   * Delete a label permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a label exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Apply a label to a card
   */
  applyToCard(labelId: string, cardId: string): Promise<void>;

  /**
   * Remove a label from a card
   */
  removeFromCard(labelId: string, cardId: string): Promise<void>;

  /**
   * Check if a label is applied to a card
   */
  isAppliedToCard(labelId: string, cardId: string): Promise<boolean>;
}
