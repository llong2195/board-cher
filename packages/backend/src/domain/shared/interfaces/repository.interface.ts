/**
 * Base repository interface defining common CRUD operations.
 *
 * This interface provides a contract for data access operations that
 * all domain repositories should implement. It abstracts TypeORM
 * specifics and allows for easier testing and potential database swaps.
 *
 * @template T - The entity type
 * @template ID - The type of the entity's identifier (usually string or number)
 *
 * @example
 * ```typescript
 * export interface IBoardRepository extends IRepository<Board, string> {
 *   findByUserId(userId: string): Promise<Board[]>;
 *   findByIdWithLists(boardId: string): Promise<Board | null>;
 * }
 * ```
 */
export interface IRepository<T, ID = string> {
  /**
   * Finds an entity by its unique identifier.
   *
   * @param id - The entity identifier
   * @returns The entity if found, null otherwise
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Finds all entities matching the given criteria.
   *
   * @param criteria - Optional filter criteria
   * @returns Array of matching entities
   */
  findAll(criteria?: Partial<T>): Promise<T[]>;

  /**
   * Finds a single entity matching the given criteria.
   *
   * @param criteria - Filter criteria
   * @returns The entity if found, null otherwise
   */
  findOne(criteria: Partial<T>): Promise<T | null>;

  /**
   * Creates a new entity instance (without persisting).
   *
   * @param data - Entity data
   * @returns The created entity instance
   */
  create(data: Partial<T>): T;

  /**
   * Saves an entity to the database (insert or update).
   *
   * @param entity - The entity to save
   * @returns The saved entity with generated fields (id, timestamps)
   */
  save(entity: T): Promise<T>;

  /**
   * Updates an entity by its identifier.
   *
   * @param id - The entity identifier
   * @param data - Partial entity data to update
   * @returns The updated entity
   */
  update(id: ID, data: Partial<T>): Promise<T>;

  /**
   * Deletes an entity by its identifier.
   *
   * @param id - The entity identifier
   * @returns True if entity was deleted, false if not found
   */
  delete(id: ID): Promise<boolean>;

  /**
   * Counts entities matching the given criteria.
   *
   * @param criteria - Optional filter criteria
   * @returns The count of matching entities
   */
  count(criteria?: Partial<T>): Promise<number>;

  /**
   * Checks if an entity exists with the given identifier.
   *
   * @param id - The entity identifier
   * @returns True if entity exists, false otherwise
   */
  exists(id: ID): Promise<boolean>;
}
