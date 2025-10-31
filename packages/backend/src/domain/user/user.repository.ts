import { User } from './user.model';

/**
 * User repository interface
 * Defines operations for persisting and retrieving users
 */
export interface UserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user
   */
  create(user: User): Promise<User>;

  /**
   * Update existing user
   */
  update(user: User): Promise<User>;

  /**
   * Delete user by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;
}
