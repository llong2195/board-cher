/**
 * T207 - CardAssignment Domain Model (US6)
 * User Story 6: Card Assignment and Notifications
 *
 * Represents the assignment of a user to a card
 * Value object within Card aggregate
 */

export class CardAssignment {
  constructor(
    public readonly cardId: string,
    public readonly userId: string,
    public readonly assignedBy: string,
    public readonly assignedAt: Date,
  ) {}

  /**
   * Create a new card assignment
   */
  static create(
    cardId: string,
    userId: string,
    assignedBy: string,
  ): CardAssignment {
    return new CardAssignment(cardId, userId, assignedBy, new Date());
  }

  /**
   * Check if assignment is for a specific user
   */
  isForUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if assignment was made by a specific user
   */
  wasAssignedBy(userId: string): boolean {
    return this.assignedBy === userId;
  }

  /**
   * Check if this assignment matches card and user
   */
  matches(cardId: string, userId: string): boolean {
    return this.cardId === cardId && this.userId === userId;
  }
}
