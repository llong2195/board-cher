import { Attachment } from './attachment.model';

/**
 * AttachmentRepository Interface
 *
 * Defines the contract for Attachment persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface IAttachmentRepository {
  /**
   * Find an attachment by ID
   */
  findById(id: string): Promise<Attachment | null>;

  /**
   * Find all attachments for a card
   */
  findByCardId(cardId: string): Promise<Attachment[]>;

  /**
   * Find attachments by user
   */
  findByUserId(userId: string): Promise<Attachment[]>;

  /**
   * Save an attachment (create or update)
   */
  save(attachment: Attachment): Promise<Attachment>;

  /**
   * Delete an attachment permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an attachment exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count attachments for a card
   */
  countByCardId(cardId: string): Promise<number>;

  /**
   * Get total file size for a card
   */
  getTotalSizeByCardId(cardId: string): Promise<number>;
}
