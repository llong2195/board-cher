/**
 * Board Domain Model
 *
 * Represents a project workspace containing lists and cards.
 * This is an aggregate root in the DDD context.
 */

export class Board {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public name: string,
    public description: string | null,
    public color: string | null,
    public isArchived: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly createdBy: string,
  ) {
    this.validate();
  }

  /**
   * Create a new Board instance
   */
  static create(
    id: string,
    organizationId: string,
    name: string,
    createdBy: string,
    description: string | null = null,
    color: string | null = null,
  ): Board {
    return new Board(
      id,
      organizationId,
      name,
      description,
      color,
      false, // isArchived
      new Date(),
      new Date(),
      createdBy,
    );
  }

  /**
   * Update board details
   */
  update(
    name?: string,
    description?: string | null,
    color?: string | null,
  ): void {
    if (name !== undefined) {
      this.name = name;
    }
    if (description !== undefined) {
      this.description = description;
    }
    if (color !== undefined) {
      this.color = color;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Archive the board
   */
  archive(): void {
    if (this.isArchived) {
      throw new Error('Board is already archived');
    }
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  /**
   * Restore the board from archive
   */
  restore(): void {
    if (!this.isArchived) {
      throw new Error('Board is not archived');
    }
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  /**
   * Validate board invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Board name cannot be empty');
    }
    if (this.name.length > 200) {
      throw new Error('Board name cannot exceed 200 characters');
    }
    if (this.color && !this.isValidHexColor(this.color)) {
      throw new Error('Board color must be a valid hex color format');
    }
    if (!this.organizationId) {
      throw new Error('Board must belong to an organization');
    }
  }

  /**
   * Validate hex color format
   */
  private isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Check if board can be deleted
   */
  canDelete(): boolean {
    // Business rule: Only archived boards can be permanently deleted
    return this.isArchived;
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      name: this.name,
      description: this.description,
      color: this.color,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
    };
  }
}
