/**
 * Comment Domain Model (T131)
 *
 * Represents a text comment on a card.
 * Users can add comments to discuss work items, provide updates, or ask questions.
 */

export class Comment {
  constructor(
    public readonly id: string,
    public readonly cardId: string,
    public readonly userId: string,
    public content: string,
    public isEdited: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new Comment instance
   */
  static create(
    id: string,
    cardId: string,
    userId: string,
    content: string,
  ): Comment {
    return new Comment(
      id,
      cardId,
      userId,
      content,
      false, // isEdited
      new Date(),
      new Date(),
    );
  }

  /**
   * Update comment content
   */
  edit(newContent: string): void {
    if (newContent === this.content) {
      return; // No change
    }
    this.content = newContent;
    this.isEdited = true;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Validate comment invariants
   */
  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    if (this.content.length > 10000) {
      throw new Error('Comment content cannot exceed 10,000 characters');
    }
    if (!this.cardId) {
      throw new Error('Comment must belong to a card');
    }
    if (!this.userId) {
      throw new Error('Comment must have an author');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      cardId: this.cardId,
      userId: this.userId,
      content: this.content,
      isEdited: this.isEdited,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
