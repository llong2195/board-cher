/**
 * List Domain Model
 *
 * Represents a workflow stage column on a board (e.g., "To Do", "In Progress").
 * Entity within the Board aggregate.
 */

export class List {
  constructor(
    public readonly id: string,
    public readonly boardId: string,
    public name: string,
    public position: number,
    public isArchived: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new List instance
   */
  static create(
    id: string,
    boardId: string,
    name: string,
    position: number,
  ): List {
    return new List(
      id,
      boardId,
      name,
      position,
      false, // isArchived
      new Date(),
      new Date(),
    );
  }

  /**
   * Update list name
   */
  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Move list to a new position
   */
  moveTo(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Archive the list
   */
  archive(): void {
    if (this.isArchived) {
      throw new Error('List is already archived');
    }
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  /**
   * Restore the list from archive
   */
  restore(): void {
    if (!this.isArchived) {
      throw new Error('List is not archived');
    }
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  /**
   * Validate list invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('List name cannot be empty');
    }
    if (this.name.length > 100) {
      throw new Error('List name cannot exceed 100 characters');
    }
    if (!this.boardId) {
      throw new Error('List must belong to a board');
    }
    if (this.position < 0) {
      throw new Error('List position cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      boardId: this.boardId,
      name: this.name,
      position: this.position,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
