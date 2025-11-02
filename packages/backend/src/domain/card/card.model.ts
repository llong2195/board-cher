/**
 * Card Domain Model
 *
 * Represents a work item or task on the board.
 * This is an aggregate root in the DDD context.
 */

export class Card {
  constructor(
    public readonly id: string,
    public listId: string,
    public title: string,
    public description: string | null,
    public position: number,
    public dueDate: Date | null,
    public isArchived: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly createdBy: string,
  ) {
    this.validate();
  }

  /**
   * Create a new Card instance
   */
  static create(
    id: string,
    listId: string,
    title: string,
    position: number,
    createdBy: string,
    description: string | null = null,
    dueDate: Date | null = null,
  ): Card {
    return new Card(
      id,
      listId,
      title,
      description,
      position,
      dueDate,
      false, // isArchived
      new Date(),
      new Date(),
      createdBy,
    );
  }

  /**
   * Update card details
   */
  update(
    title?: string,
    description?: string | null,
    dueDate?: Date | null,
  ): void {
    if (title !== undefined) {
      this.title = title;
    }
    if (description !== undefined) {
      this.description = description;
    }
    if (dueDate !== undefined) {
      this.dueDate = dueDate;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Move card to a different list and/or position
   */
  moveTo(newListId: string, newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.listId = newListId;
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Update card position within the same list
   */
  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Archive the card
   */
  archive(): void {
    if (this.isArchived) {
      throw new Error('Card is already archived');
    }
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  /**
   * Restore the card from archive
   */
  restore(): void {
    if (!this.isArchived) {
      throw new Error('Card is not archived');
    }
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  /**
   * Set due date for the card
   */
  setDueDate(dueDate: Date | null): void {
    if (dueDate && dueDate < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * Check if card is overdue
   */
  isOverdue(): boolean {
    if (!this.dueDate || this.isArchived) {
      return false;
    }
    return this.dueDate < new Date();
  }

  /**
   * Validate card invariants
   */
  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Card title cannot be empty');
    }
    if (this.title.length > 500) {
      throw new Error('Card title cannot exceed 500 characters');
    }
    if (this.description && this.description.length > 50000) {
      throw new Error('Card description cannot exceed 50,000 characters');
    }
    if (!this.listId) {
      throw new Error('Card must belong to a list');
    }
    if (this.position < 0) {
      throw new Error('Card position cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      listId: this.listId,
      title: this.title,
      description: this.description,
      position: this.position,
      dueDate: this.dueDate,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      isOverdue: this.isOverdue(),
    };
  }
}
