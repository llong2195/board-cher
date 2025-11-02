import { Comment } from './comment.model';

/**
 * CommentRepository Interface
 *
 * Defines the contract for Comment persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface ICommentRepository {
  /**
   * Find a comment by ID
   */
  findById(id: string): Promise<Comment | null>;

  /**
   * Find all comments for a card
   */
  findByCardId(cardId: string): Promise<Comment[]>;

  /**
   * Find comments by user
   */
  findByUserId(userId: string): Promise<Comment[]>;

  /**
   * Save a comment (create or update)
   */
  save(comment: Comment): Promise<Comment>;

  /**
   * Delete a comment permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a comment exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count comments for a card
   */
  countByCardId(cardId: string): Promise<number>;
}
