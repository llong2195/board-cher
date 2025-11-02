/**
 * Label Domain Model (T133)
 *
 * Represents a label that can be applied to cards for categorization.
 * Labels are board-level entities with predefined colors.
 *
 * Color System:
 * - 10 predefined colors: red, orange, yellow, green, blue, purple, pink, gray, brown, black
 * - Labels can have a name or be color-only (name optional)
 */

export class Label {
  // Predefined color palette
  public static readonly ALLOWED_COLORS = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
    'gray',
    'brown',
    'black',
  ] as const;

  // Color hex codes for UI rendering
  public static readonly COLOR_HEX_MAP: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    gray: '#6b7280',
    brown: '#92400e',
    black: '#1f2937',
  };

  constructor(
    public readonly id: string,
    public readonly boardId: string,
    public name: string | null,
    public readonly color: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new Label instance
   */
  static create(
    id: string,
    boardId: string,
    color: string,
    name: string | null = null,
  ): Label {
    return new Label(id, boardId, name, color, new Date(), new Date());
  }

  /**
   * Update label name
   */
  rename(newName: string | null): void {
    if (newName === this.name) {
      return; // No change
    }
    this.name = newName;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Get hex color code for UI rendering
   */
  getHexColor(): string {
    return Label.COLOR_HEX_MAP[this.color] || '#6b7280'; // Default to gray
  }

  /**
   * Check if label is color-only (no name)
   */
  isColorOnly(): boolean {
    return !this.name || this.name.trim().length === 0;
  }

  /**
   * Get display text (name or color)
   */
  getDisplayText(): string {
    return this.name || this.color;
  }

  /**
   * Validate label invariants
   */
  private validate(): void {
    if (!this.color) {
      throw new Error('Label color is required');
    }
    if (!Label.ALLOWED_COLORS.includes(this.color as any)) {
      throw new Error(
        `Invalid color '${this.color}'. Allowed colors: ${Label.ALLOWED_COLORS.join(', ')}`,
      );
    }
    if (this.name !== null && this.name.length > 50) {
      throw new Error('Label name cannot exceed 50 characters');
    }
    if (!this.boardId) {
      throw new Error('Label must belong to a board');
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
      color: this.color,
      hexColor: this.getHexColor(),
      displayText: this.getDisplayText(),
      isColorOnly: this.isColorOnly(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
