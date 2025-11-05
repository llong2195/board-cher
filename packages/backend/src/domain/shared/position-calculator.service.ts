/**
 * PositionCalculatorService
 *
 * Service for calculating positions when reordering lists or cards.
 * Maintains sequential integer positions (1, 2, 3, ...) for simplicity and testability.
 *
 * User Story 1: Create and Organize Work Items
 * Task T089: Position calculation for list/card reordering
 */
export class PositionCalculatorService {
  /**
   * Calculate position value for inserting a new item
   * @param existingItems - Items already in the container with their positions
   * @param desiredPosition - Desired 1-based position for the new item
   * @returns The position value to use for the new item
   */
  calculateInsertPosition(
    existingItems: Array<{ position: number }>,
    desiredPosition: number,
  ): number {
    if (existingItems.length === 0) {
      return 1;
    }

    const maxPos = Math.max(...existingItems.map((item) => item.position));

    // If position exceeds list, place at end
    if (desiredPosition > maxPos) {
      return maxPos + 1;
    }

    return desiredPosition;
  }

  /**
   * Recalculate positions of existing items after a new item is inserted
   * Items at or after the inserted position are shifted down
   * @param existingItems - Items before the insertion
   * @param insertedPosition - The position where new item was inserted
   * @returns Updated items with shifted positions
   */
  recalculateAfterInsert<T extends { position: number }>(
    existingItems: T[],
    insertedPosition: number,
  ): T[] {
    return existingItems.map((item) => {
      if (item.position >= insertedPosition) {
        return { ...item, position: item.position + 1 };
      }
      return item;
    });
  }

  /**
   * Recalculate positions of remaining items after an item is deleted
   * Items after the deleted position are shifted up
   * @param remainingItems - Items after the deletion
   * @param deletedPosition - The position that was deleted
   * @returns Updated items with shifted positions
   */
  recalculateAfterDelete<T extends { position: number }>(
    remainingItems: T[],
    deletedPosition: number,
  ): T[] {
    return remainingItems.map((item) => {
      if (item.position > deletedPosition) {
        return { ...item, position: item.position - 1 };
      }
      return item;
    });
  }

  /**
   * Recalculate all positions when an item moves within the same container
   * @param items - All items in the container
   * @param movedItemId - ID of the item being moved
   * @param oldPosition - Current position of the item
   * @param newPosition - Target position for the item
   * @returns All items with updated positions
   */
  recalculateAfterMove<T extends { id: string; position: number }>(
    items: T[],
    movedItemId: string,
    oldPosition: number,
    newPosition: number,
  ): T[] {
    // No change needed
    if (oldPosition === newPosition) {
      return items;
    }

    const movedItem = items.find((item) => item.id === movedItemId);
    if (!movedItem) {
      throw new Error(`Item with id ${movedItemId} not found`);
    }

    const result = items.map((item) => {
      if (item.id === movedItemId) {
        // Update moved item's position
        return { ...item, position: newPosition };
      } else if (oldPosition < newPosition) {
        // Moving down: shift items between old and new positions up
        if (item.position > oldPosition && item.position <= newPosition) {
          return { ...item, position: item.position - 1 };
        }
      } else {
        // Moving up: shift items between new and old positions down
        if (item.position >= newPosition && item.position < oldPosition) {
          return { ...item, position: item.position + 1 };
        }
      }
      return item;
    });

    return result.sort((a, b) => a.position - b.position);
  }

  /**
   * Recalculate positions when moving an item from one container to another
   * @param sourceItems - Items in the source container
   * @param targetItems - Items in the target container
   * @param movedItemId - ID of the item being moved
   * @param targetPosition - Desired position in target container
   * @returns Updated source items, target items, and the moved item with new position
   */
  recalculateAfterMoveToOtherContainer<
    T extends { id: string; position: number },
  >(
    sourceItems: T[],
    targetItems: T[],
    movedItemId: string,
    targetPosition: number,
  ): { source: T[]; target: T[]; movedItem: T } {
    const movedItem = sourceItems.find((item) => item.id === movedItemId);
    if (!movedItem) {
      throw new Error(`Item with id ${movedItemId} not found in source`);
    }

    // Remove from source and recalculate positions
    const newSource = this.recalculateAfterDelete(
      sourceItems.filter((item) => item.id !== movedItemId),
      movedItem.position,
    );

    // Add to target at desired position and recalculate
    const movedItemWithNewPos = { ...movedItem, position: targetPosition };
    const newTarget = this.recalculateAfterInsert(targetItems, targetPosition);

    return {
      source: newSource,
      target: newTarget,
      movedItem: movedItemWithNewPos,
    };
  }

  /**
   * Normalize positions to be sequential starting from 1
   * Handles gaps, duplicates, and out-of-order positions
   * @param items - Items to normalize
   * @returns Items with sequential positions (1, 2, 3, ...)
   */
  normalizePositions<T extends { position: number }>(items: T[]): T[] {
    if (items.length === 0) {
      return [];
    }

    // Sort by current position
    const sorted = [...items].sort((a, b) => a.position - b.position);

    // Assign sequential positions
    return sorted.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  }

  /**
   * Validate that positions are sequential and complete (1, 2, 3, ...)
   * @param items - Items to validate
   * @returns True if positions are valid, false otherwise
   */
  validatePositions(items: Array<{ position: number }>): boolean {
    if (items.length === 0) {
      return true;
    }

    const positions = items.map((item) => item.position).sort((a, b) => a - b);

    // Must start at 1
    if (positions[0] !== 1) {
      return false;
    }

    // Must be sequential with no gaps or duplicates
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        return false;
      }
    }

    return true;
  }
}
