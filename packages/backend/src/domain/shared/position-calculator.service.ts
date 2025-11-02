/**
 * PositionCalculatorService
 *
 * Service for calculating positions when reordering lists or cards.
 * Uses a strategy that maintains sequential positions with gaps for future insertions.
 */
export class PositionCalculatorService {
  private static readonly POSITION_GAP = 1000;

  /**
   * Calculate new positions when inserting an item at a specific position
   */
  static calculateInsertPosition(
    existingPositions: number[],
    targetPosition: number,
  ): number {
    const sorted = [...existingPositions].sort((a, b) => a - b);

    // If inserting at the end
    if (targetPosition >= sorted.length) {
      const lastPosition = sorted[sorted.length - 1] || 0;
      return lastPosition + this.POSITION_GAP;
    }

    // If inserting at the beginning
    if (targetPosition === 0) {
      const firstPosition = sorted[0] || this.POSITION_GAP;
      return Math.max(0, firstPosition - this.POSITION_GAP);
    }

    // Inserting in the middle
    const prevPosition = sorted[targetPosition - 1];
    const nextPosition = sorted[targetPosition];

    // If there's enough space between positions
    if (nextPosition - prevPosition > 1) {
      return Math.floor((prevPosition + nextPosition) / 2);
    }

    // Need to rebalance positions
    return prevPosition + 1;
  }

  /**
   * Calculate new positions when moving an item from one position to another
   */
  static calculateMovePositions(
    items: Array<{ id: string; position: number }>,
    itemId: string,
    targetPosition: number,
  ): Array<{ id: string; position: number }> {
    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    const currentPosition = items[itemIndex].position;

    // No change if moving to the same position
    if (currentPosition === targetPosition) {
      return items;
    }

    const sorted = [...items].sort((a, b) => a.position - b.position);
    const result: Array<{ id: string; position: number }> = [];

    // Remove the item being moved
    const withoutMovedItem = sorted.filter((item) => item.id !== itemId);

    // Insert the item at the target position
    withoutMovedItem.splice(targetPosition, 0, sorted[itemIndex]);

    // Recalculate all positions sequentially
    withoutMovedItem.forEach((item, index) => {
      result.push({
        id: item.id,
        position: index * this.POSITION_GAP,
      });
    });

    return result;
  }

  /**
   * Rebalance positions to ensure sequential ordering with gaps
   */
  static rebalancePositions(
    items: Array<{ id: string; position: number }>,
  ): Array<{ id: string; position: number }> {
    const sorted = [...items].sort((a, b) => a.position - b.position);

    return sorted.map((item, index) => ({
      id: item.id,
      position: index * this.POSITION_GAP,
    }));
  }

  /**
   * Get the next available position (for appending to the end)
   */
  static getNextPosition(existingPositions: number[]): number {
    if (existingPositions.length === 0) {
      return 0;
    }

    const maxPosition = Math.max(...existingPositions);
    return maxPosition + this.POSITION_GAP;
  }

  /**
   * Check if positions need rebalancing (positions are too close together)
   */
  static needsRebalancing(positions: number[]): boolean {
    if (positions.length < 2) {
      return false;
    }

    const sorted = [...positions].sort((a, b) => a - b);

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] < 1) {
        return true;
      }
    }

    return false;
  }
}
