/**
 * Checklist Domain Model (T134)
 *
 * Represents a checklist on a card with multiple checkable items.
 * Used for tracking sub-tasks or requirements for a work item.
 *
 * Features:
 * - Progress tracking (completed/total items)
 * - Position-based ordering
 * - Item management (add, remove, toggle)
 */

export class ChecklistItem {
  constructor(
    public readonly id: string,
    public text: string,
    public isCompleted: boolean,
    public position: number,
  ) {
    this.validate();
  }

  /**
   * Create a new ChecklistItem instance
   */
  static create(id: string, text: string, position: number): ChecklistItem {
    return new ChecklistItem(id, text, false, position);
  }

  /**
   * Toggle completion status
   */
  toggle(): void {
    this.isCompleted = !this.isCompleted;
  }

  /**
   * Update item text
   */
  updateText(newText: string): void {
    this.text = newText;
    this.validate();
  }

  /**
   * Update position
   */
  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.position = newPosition;
  }

  /**
   * Validate item invariants
   */
  private validate(): void {
    if (!this.text || this.text.trim().length === 0) {
      throw new Error('Checklist item text cannot be empty');
    }
    if (this.text.length > 200) {
      throw new Error('Checklist item text cannot exceed 200 characters');
    }
    if (this.position < 0) {
      throw new Error('Position cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      text: this.text,
      isCompleted: this.isCompleted,
      position: this.position,
    };
  }
}

export class Checklist {
  private items: ChecklistItem[] = [];

  constructor(
    public readonly id: string,
    public readonly cardId: string,
    public name: string,
    public position: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new Checklist instance
   */
  static create(
    id: string,
    cardId: string,
    name: string,
    position: number,
  ): Checklist {
    return new Checklist(id, cardId, name, position, new Date(), new Date());
  }

  /**
   * Rename the checklist
   */
  rename(newName: string): void {
    this.name = newName;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Update checklist position
   */
  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  /**
   * Add an item to the checklist
   */
  addItem(item: ChecklistItem): void {
    this.items.push(item);
    this.updatedAt = new Date();
  }

  /**
   * Remove an item from the checklist
   */
  removeItem(itemId: string): void {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new Error(`Checklist item with id '${itemId}' not found`);
    }
    this.items.splice(index, 1);
    this.updatedAt = new Date();
  }

  /**
   * Get all items
   */
  getItems(): ChecklistItem[] {
    return [...this.items].sort((a, b) => a.position - b.position);
  }

  /**
   * Set items (for hydration from database)
   */
  setItems(items: ChecklistItem[]): void {
    this.items = items;
  }

  /**
   * Get a specific item by ID
   */
  getItem(itemId: string): ChecklistItem | undefined {
    return this.items.find((item) => item.id === itemId);
  }

  /**
   * Toggle an item's completion status
   */
  toggleItem(itemId: string): void {
    const item = this.getItem(itemId);
    if (!item) {
      throw new Error(`Checklist item with id '${itemId}' not found`);
    }
    item.toggle();
    this.updatedAt = new Date();
  }

  /**
   * Calculate completion progress
   */
  getProgress(): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const total = this.items.length;
    const completed = this.items.filter((item) => item.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  /**
   * Check if all items are completed
   */
  isComplete(): boolean {
    if (this.items.length === 0) {
      return false;
    }
    return this.items.every((item) => item.isCompleted);
  }

  /**
   * Validate checklist invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Checklist name cannot be empty');
    }
    if (this.name.length > 100) {
      throw new Error('Checklist name cannot exceed 100 characters');
    }
    if (!this.cardId) {
      throw new Error('Checklist must belong to a card');
    }
    if (this.position < 0) {
      throw new Error('Position cannot be negative');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    const progress = this.getProgress();
    return {
      id: this.id,
      cardId: this.cardId,
      name: this.name,
      position: this.position,
      items: this.getItems().map((item) => item.toObject()),
      progress,
      isComplete: this.isComplete(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
