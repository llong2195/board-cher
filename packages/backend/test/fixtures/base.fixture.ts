/**
 * Base fixture class implementing the Factory pattern for test data generation.
 *
 * This abstract class provides a template for creating domain-specific fixtures
 * that generate consistent test data with realistic values.
 *
 * @template T - The entity type this fixture creates
 *
 * @example
 * ```typescript
 * export class BoardFixture extends BaseFixture<Board> {
 *   build(overrides?: Partial<Board>): Board {
 *     return {
 *       id: this.generateId(),
 *       title: 'Test Board',
 *       userId: this.generateId(),
 *       createdAt: new Date(),
 *       ...overrides,
 *     };
 *   }
 * }
 * ```
 */
export abstract class BaseFixture<T> {
  /**
   * Builds a single entity with optional property overrides.
   *
   * @param overrides - Properties to override in the generated entity
   * @returns A new entity instance with test data
   */
  abstract build(overrides?: Partial<T>): T;

  /**
   * Builds multiple entities with optional overrides.
   *
   * @param count - Number of entities to generate
   * @param overrides - Properties to override in all generated entities
   * @returns Array of entity instances
   */
  buildList(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Generates a unique identifier (UUID v4 format).
   */
  protected generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generates a random string of specified length.
   */
  protected generateString(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  }

  /**
   * Generates a random integer between min and max (inclusive).
   */
  protected generateInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Selects a random element from an array.
   */
  protected selectRandom<E>(array: E[]): E {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generates a random email address.
   */
  protected generateEmail(): string {
    return `${this.generateString(8).toLowerCase()}@test.com`;
  }

  /**
   * Generates a random past date within the last N days.
   */
  protected generatePastDate(daysAgo: number = 30): Date {
    const now = new Date();
    const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const randomTime =
      past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
  }

  /**
   * Generates a random future date within the next N days.
   */
  protected generateFutureDate(daysAhead: number = 30): Date {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const randomTime =
      now.getTime() + Math.random() * (future.getTime() - now.getTime());
    return new Date(randomTime);
  }
}
