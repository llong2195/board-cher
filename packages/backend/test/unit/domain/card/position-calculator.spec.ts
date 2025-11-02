/**
 * Unit Tests for Position Calculator Service
 * User Story 1: Create and Organize Work Items
 *
 * Test Coverage:
 * - Calculate new position when inserting item at specific position
 * - Recalculate positions after item deletion
 * - Recalculate positions after item move within same container
 * - Recalculate positions after item move to different container
 * - Handle edge cases (empty list, single item, first/last position)
 * - Ensure unique sequential positions after operations
 *
 * TDD Approach: These tests are written FIRST and will fail until implementation is complete.
 * This service will be used by List and Card operations to maintain proper ordering.
 */

describe('PositionCalculatorService', () => {
  let positionCalculator: PositionCalculatorService;

  beforeEach(() => {
    positionCalculator = new PositionCalculatorService();
  });

  describe('calculateInsertPosition', () => {
    it('should return 1 for empty list', () => {
      const result = positionCalculator.calculateInsertPosition([], 1);
      expect(result).toBe(1);
    });

    it('should insert at beginning of list', () => {
      const existingItems = [{ position: 1 }, { position: 2 }, { position: 3 }];
      const result = positionCalculator.calculateInsertPosition(
        existingItems,
        1,
      );
      expect(result).toBe(1);
    });

    it('should insert at end of list', () => {
      const existingItems = [{ position: 1 }, { position: 2 }, { position: 3 }];
      const result = positionCalculator.calculateInsertPosition(
        existingItems,
        4,
      );
      expect(result).toBe(4);
    });

    it('should insert in middle of list', () => {
      const existingItems = [{ position: 1 }, { position: 2 }, { position: 3 }];
      const result = positionCalculator.calculateInsertPosition(
        existingItems,
        2,
      );
      expect(result).toBe(2);
    });

    it('should handle position exceeding list length', () => {
      const existingItems = [{ position: 1 }, { position: 2 }];
      const result = positionCalculator.calculateInsertPosition(
        existingItems,
        999,
      );
      // Should place at end
      expect(result).toBe(3);
    });

    it('should handle single item list', () => {
      const existingItems = [{ position: 1 }];
      const result = positionCalculator.calculateInsertPosition(
        existingItems,
        2,
      );
      expect(result).toBe(2);
    });
  });

  describe('recalculateAfterInsert', () => {
    it('should shift positions down when inserting at beginning', () => {
      const existingItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const result = positionCalculator.recalculateAfterInsert(
        existingItems,
        1,
      );

      expect(result).toEqual([
        { id: '1', position: 2 },
        { id: '2', position: 3 },
        { id: '3', position: 4 },
      ]);
    });

    it('should shift only affected positions when inserting in middle', () => {
      const existingItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const result = positionCalculator.recalculateAfterInsert(
        existingItems,
        2,
      );

      expect(result).toEqual([
        { id: '1', position: 1 }, // Unchanged
        { id: '2', position: 3 }, // Shifted
        { id: '3', position: 4 }, // Shifted
      ]);
    });

    it('should not change positions when inserting at end', () => {
      const existingItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const result = positionCalculator.recalculateAfterInsert(
        existingItems,
        4,
      );

      // No changes needed
      expect(result).toEqual(existingItems);
    });

    it('should handle empty list', () => {
      const result = positionCalculator.recalculateAfterInsert([], 1);
      expect(result).toEqual([]);
    });
  });

  describe('recalculateAfterDelete', () => {
    it('should shift positions up after deleting first item', () => {
      const remainingItems = [
        { id: '2', position: 2 },
        { id: '3', position: 3 },
        { id: '4', position: 4 },
      ];
      const deletedPosition = 1;

      const result = positionCalculator.recalculateAfterDelete(
        remainingItems,
        deletedPosition,
      );

      expect(result).toEqual([
        { id: '2', position: 1 },
        { id: '3', position: 2 },
        { id: '4', position: 3 },
      ]);
    });

    it('should shift only affected positions after deleting middle item', () => {
      const remainingItems = [
        { id: '1', position: 1 },
        { id: '3', position: 3 },
        { id: '4', position: 4 },
      ];
      const deletedPosition = 2;

      const result = positionCalculator.recalculateAfterDelete(
        remainingItems,
        deletedPosition,
      );

      expect(result).toEqual([
        { id: '1', position: 1 }, // Unchanged
        { id: '3', position: 2 }, // Shifted
        { id: '4', position: 3 }, // Shifted
      ]);
    });

    it('should not change positions after deleting last item', () => {
      const remainingItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const deletedPosition = 4;

      const result = positionCalculator.recalculateAfterDelete(
        remainingItems,
        deletedPosition,
      );

      // No changes needed
      expect(result).toEqual(remainingItems);
    });

    it('should handle single item remaining', () => {
      const remainingItems = [{ id: '2', position: 2 }];
      const deletedPosition = 1;

      const result = positionCalculator.recalculateAfterDelete(
        remainingItems,
        deletedPosition,
      );

      expect(result).toEqual([{ id: '2', position: 1 }]);
    });

    it('should handle empty list after deletion', () => {
      const result = positionCalculator.recalculateAfterDelete([], 1);
      expect(result).toEqual([]);
    });
  });

  describe('recalculateAfterMove - same container', () => {
    it('should handle move down (position 1 → 3)', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
        { id: '4', position: 4 },
      ];
      const movedItemId = '1';
      const oldPosition = 1;
      const newPosition = 3;

      const result = positionCalculator.recalculateAfterMove(
        items,
        movedItemId,
        oldPosition,
        newPosition,
      );

      expect(result).toEqual([
        { id: '2', position: 1 }, // Shifted up
        { id: '3', position: 2 }, // Shifted up
        { id: '1', position: 3 }, // Moved item
        { id: '4', position: 4 }, // Unchanged
      ]);
    });

    it('should handle move up (position 4 → 2)', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
        { id: '4', position: 4 },
      ];
      const movedItemId = '4';
      const oldPosition = 4;
      const newPosition = 2;

      const result = positionCalculator.recalculateAfterMove(
        items,
        movedItemId,
        oldPosition,
        newPosition,
      );

      expect(result).toEqual([
        { id: '1', position: 1 }, // Unchanged
        { id: '4', position: 2 }, // Moved item
        { id: '2', position: 3 }, // Shifted down
        { id: '3', position: 4 }, // Shifted down
      ]);
    });

    it('should handle move to first position', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const movedItemId = '3';
      const oldPosition = 3;
      const newPosition = 1;

      const result = positionCalculator.recalculateAfterMove(
        items,
        movedItemId,
        oldPosition,
        newPosition,
      );

      expect(result).toEqual([
        { id: '3', position: 1 },
        { id: '1', position: 2 },
        { id: '2', position: 3 },
      ]);
    });

    it('should handle move to last position', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const movedItemId = '1';
      const oldPosition = 1;
      const newPosition = 3;

      const result = positionCalculator.recalculateAfterMove(
        items,
        movedItemId,
        oldPosition,
        newPosition,
      );

      expect(result).toEqual([
        { id: '2', position: 1 },
        { id: '3', position: 2 },
        { id: '1', position: 3 },
      ]);
    });

    it('should handle no-op move (same position)', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const movedItemId = '2';
      const oldPosition = 2;
      const newPosition = 2;

      const result = positionCalculator.recalculateAfterMove(
        items,
        movedItemId,
        oldPosition,
        newPosition,
      );

      // No changes
      expect(result).toEqual(items);
    });
  });

  describe('recalculateAfterMove - different containers', () => {
    it('should remove from source and insert in target at beginning', () => {
      const sourceItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];
      const targetItems = [
        { id: 'A', position: 1 },
        { id: 'B', position: 2 },
      ];
      const movedItemId = '2';
      const targetPosition = 1;

      const result = positionCalculator.recalculateAfterMoveToOtherContainer(
        sourceItems,
        targetItems,
        movedItemId,
        targetPosition,
      );

      expect(result.source).toEqual([
        { id: '1', position: 1 },
        { id: '3', position: 2 }, // Shifted up
      ]);

      expect(result.target).toEqual([
        { id: 'A', position: 2 }, // Shifted down
        { id: 'B', position: 3 }, // Shifted down
      ]);

      expect(result.movedItem).toEqual({
        id: '2',
        position: 1,
      });
    });

    it('should remove from source and insert in target at end', () => {
      const sourceItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
      ];
      const targetItems = [{ id: 'A', position: 1 }];
      const movedItemId = '1';
      const targetPosition = 2;

      const result = positionCalculator.recalculateAfterMoveToOtherContainer(
        sourceItems,
        targetItems,
        movedItemId,
        targetPosition,
      );

      expect(result.source).toEqual([{ id: '2', position: 1 }]);

      expect(result.target).toEqual([{ id: 'A', position: 1 }]); // Unchanged

      expect(result.movedItem).toEqual({
        id: '1',
        position: 2,
      });
    });

    it('should handle move to empty target container', () => {
      const sourceItems = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
      ];
      const targetItems: any[] = [];
      const movedItemId = '2';
      const targetPosition = 1;

      const result = positionCalculator.recalculateAfterMoveToOtherContainer(
        sourceItems,
        targetItems,
        movedItemId,
        targetPosition,
      );

      expect(result.source).toEqual([{ id: '1', position: 1 }]);

      expect(result.target).toEqual([]);

      expect(result.movedItem).toEqual({
        id: '2',
        position: 1,
      });
    });

    it('should handle moving last item from source', () => {
      const sourceItems = [{ id: '1', position: 1 }];
      const targetItems = [{ id: 'A', position: 1 }];
      const movedItemId = '1';
      const targetPosition = 1;

      const result = positionCalculator.recalculateAfterMoveToOtherContainer(
        sourceItems,
        targetItems,
        movedItemId,
        targetPosition,
      );

      expect(result.source).toEqual([]);

      expect(result.target).toEqual([{ id: 'A', position: 2 }]);

      expect(result.movedItem).toEqual({
        id: '1',
        position: 1,
      });
    });
  });

  describe('normalizePositions', () => {
    it('should normalize gaps in positions', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 5 },
        { id: '3', position: 10 },
        { id: '4', position: 15 },
      ];

      const result = positionCalculator.normalizePositions(items);

      expect(result).toEqual([
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
        { id: '4', position: 4 },
      ]);
    });

    it('should handle already normalized positions', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
        { id: '3', position: 3 },
      ];

      const result = positionCalculator.normalizePositions(items);

      expect(result).toEqual(items);
    });

    it('should handle duplicate positions', () => {
      const items = [
        { id: '1', position: 1 },
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ];

      const result = positionCalculator.normalizePositions(items);

      // Should assign unique sequential positions
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
      expect(result[2].position).toBe(3);
    });

    it('should handle empty array', () => {
      const result = positionCalculator.normalizePositions([]);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [{ id: '1', position: 5 }];
      const result = positionCalculator.normalizePositions(items);
      expect(result).toEqual([{ id: '1', position: 1 }]);
    });

    it('should handle out-of-order positions', () => {
      const items = [
        { id: '1', position: 3 },
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ];

      const result = positionCalculator.normalizePositions(items);

      // Should sort by current position and reassign
      expect(result[0].id).toBe('2');
      expect(result[0].position).toBe(1);
      expect(result[1].id).toBe('3');
      expect(result[1].position).toBe(2);
      expect(result[2].id).toBe('1');
      expect(result[2].position).toBe(3);
    });
  });

  describe('validatePositions', () => {
    it('should return true for valid sequential positions', () => {
      const items = [{ position: 1 }, { position: 2 }, { position: 3 }];

      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(true);
    });

    it('should return false for duplicate positions', () => {
      const items = [{ position: 1 }, { position: 2 }, { position: 2 }];

      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(false);
    });

    it('should return false for gaps in positions', () => {
      const items = [{ position: 1 }, { position: 3 }, { position: 4 }];

      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(false);
    });

    it('should return false for positions not starting at 1', () => {
      const items = [{ position: 2 }, { position: 3 }, { position: 4 }];

      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(false);
    });

    it('should return true for empty array', () => {
      const result = positionCalculator.validatePositions([]);
      expect(result).toBe(true);
    });

    it('should return true for single item at position 1', () => {
      const items = [{ position: 1 }];
      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(true);
    });

    it('should return false for single item not at position 1', () => {
      const items = [{ position: 5 }];
      const result = positionCalculator.validatePositions(items);
      expect(result).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large positions', () => {
      const items = [{ id: '1', position: 999999 }];
      const result = positionCalculator.normalizePositions(items);
      expect(result[0].position).toBe(1);
    });

    it('should handle negative positions in normalization', () => {
      const items = [
        { id: '1', position: -1 },
        { id: '2', position: 0 },
        { id: '3', position: 1 },
      ];

      const result = positionCalculator.normalizePositions(items);

      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
      expect(result[2].position).toBe(3);
    });

    it('should maintain item order during recalculation', () => {
      const items = [
        { id: 'A', position: 1, createdAt: '2025-01-01' },
        { id: 'B', position: 2, createdAt: '2025-01-02' },
        { id: 'C', position: 3, createdAt: '2025-01-03' },
      ];

      const result = positionCalculator.recalculateAfterDelete(items, 0);

      // Should maintain all properties except position
      expect(result[0].id).toBe('A');
      expect(result[0].createdAt).toBe('2025-01-01');
    });
  });
});

/**
 * Mock implementation to define the interface
 * The actual implementation will be created in:
 * packages/backend/src/domain/shared/position-calculator.service.ts
 */
class PositionCalculatorService {
  calculateInsertPosition(
    existingItems: Array<{ position: number }>,
    desiredPosition: number,
  ): number {
    throw new Error('Not implemented - TDD test phase');
  }

  recalculateAfterInsert<T extends { position: number }>(
    existingItems: T[],
    insertedPosition: number,
  ): T[] {
    throw new Error('Not implemented - TDD test phase');
  }

  recalculateAfterDelete<T extends { position: number }>(
    remainingItems: T[],
    deletedPosition: number,
  ): T[] {
    throw new Error('Not implemented - TDD test phase');
  }

  recalculateAfterMove<T extends { id: string; position: number }>(
    items: T[],
    movedItemId: string,
    oldPosition: number,
    newPosition: number,
  ): T[] {
    throw new Error('Not implemented - TDD test phase');
  }

  recalculateAfterMoveToOtherContainer<
    T extends { id: string; position: number },
  >(
    sourceItems: T[],
    targetItems: T[],
    movedItemId: string,
    targetPosition: number,
  ): { source: T[]; target: T[]; movedItem: T } {
    throw new Error('Not implemented - TDD test phase');
  }

  normalizePositions<T extends { position: number }>(items: T[]): T[] {
    throw new Error('Not implemented - TDD test phase');
  }

  validatePositions(items: Array<{ position: number }>): boolean {
    throw new Error('Not implemented - TDD test phase');
  }
}
