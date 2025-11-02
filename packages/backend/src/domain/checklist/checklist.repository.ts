import { Checklist, ChecklistItem } from './checklist.model';

/**
 * ChecklistRepository Interface
 *
 * Defines the contract for Checklist persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface IChecklistRepository {
  /**
   * Find a checklist by ID (with items)
   */
  findById(id: string): Promise<Checklist | null>;

  /**
   * Find all checklists for a card
   */
  findByCardId(cardId: string): Promise<Checklist[]>;

  /**
   * Save a checklist (create or update)
   */
  save(checklist: Checklist): Promise<Checklist>;

  /**
   * Delete a checklist permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a checklist exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count checklists for a card
   */
  countByCardId(cardId: string): Promise<number>;

  /**
   * Save a checklist item
   */
  saveItem(checklistId: string, item: ChecklistItem): Promise<ChecklistItem>;

  /**
   * Delete a checklist item
   */
  deleteItem(itemId: string): Promise<void>;

  /**
   * Find checklist item by ID
   */
  findItemById(itemId: string): Promise<ChecklistItem | null>;
}
