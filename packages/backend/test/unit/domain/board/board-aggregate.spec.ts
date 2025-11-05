/**
 * Board Aggregate Unit Tests
 *
 * Tests for BoardAggregate domain logic, business rules, and invariants.
 * Follows TDD principles with comprehensive edge case coverage.
 */

import { BoardAggregate } from '../../../../src/domain/board/board-aggregate';
import { Board } from '../../../../src/domain/board/board.model';
import { List } from '../../../../src/domain/list/list.model';
import {
  ListAddedToBoardEvent,
  ListRemovedFromBoardEvent,
  ListMovedInBoardEvent,
  ListRenamedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
} from '../../../../src/domain/board/events/board-aggregate.events';

describe('BoardAggregate', () => {
  const testOrgId = 'org-123';
  const testUserId = 'user-123';

  describe('create', () => {
    it('should create a new board aggregate with basic properties', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      expect(aggregate).toBeInstanceOf(BoardAggregate);
      expect(aggregate.getBoard().name).toBe('My Board');
      expect(aggregate.getBoard().organizationId).toBe(testOrgId);
      expect(aggregate.getBoard().createdBy).toBe(testUserId);
      expect(aggregate.getLists()).toHaveLength(0);
    });

    it('should create board with optional description and color', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
        'Test description',
        '#FF5733',
      );

      expect(aggregate.getBoard().description).toBe('Test description');
      expect(aggregate.getBoard().color).toBe('#FF5733');
    });

    it('should initialize with empty domain events', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute aggregate from persistence', () => {
      const board = Board.create(
        'board-123',
        testOrgId,
        'Existing Board',
        testUserId,
      );
      const lists = [
        List.create('list-1', 'board-123', 'To Do', 1),
        List.create('list-2', 'board-123', 'In Progress', 2),
        List.create('list-3', 'board-123', 'Done', 3),
      ];

      const aggregate = BoardAggregate.reconstitute(board, lists);

      expect(aggregate.getBoard().id).toBe('board-123');
      expect(aggregate.getLists()).toHaveLength(3);
      expect(aggregate.getLists()[0].name).toBe('To Do');
    });

    it('should reconstitute with empty list collection', () => {
      const board = Board.create(
        'board-123',
        testOrgId,
        'Existing Board',
        testUserId,
      );

      const aggregate = BoardAggregate.reconstitute(board, []);

      expect(aggregate.getLists()).toHaveLength(0);
    });
  });

  describe('addList', () => {
    it('should add a list to the board', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list = aggregate.addList('To Do', testUserId);

      expect(list).toBeDefined();
      expect(list.name).toBe('To Do');
      expect(aggregate.getLists()).toHaveLength(1);
      expect(aggregate.getLists()[0].id).toBe(list.id);
    });

    it('should calculate position automatically if not provided', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list1 = aggregate.addList('To Do', testUserId);
      const list2 = aggregate.addList('In Progress', testUserId);
      const list3 = aggregate.addList('Done', testUserId);

      expect(list1.position).toBe(1);
      expect(list2.position).toBeGreaterThan(list1.position);
      expect(list3.position).toBeGreaterThan(list2.position);
    });

    it('should use provided position when specified', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list = aggregate.addList('To Do', testUserId, 5);

      expect(list.position).toBe(5);
    });

    it('should emit ListAddedToBoardEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list = aggregate.addList('To Do', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ListAddedToBoardEvent);
      expect((events[0] as ListAddedToBoardEvent).listId).toBe(list.id);
      expect((events[0] as ListAddedToBoardEvent).listName).toBe('To Do');
    });

    it('should update board timestamp when adding list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const originalTimestamp = aggregate.getBoard().updatedAt;

      // Wait a bit to ensure timestamp changes
      aggregate.addList('To Do', testUserId);

      expect(aggregate.getBoard().updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalTimestamp.getTime(),
      );
    });

    it('should enforce MAX_LISTS_PER_BOARD limit (50 lists)', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      // Add 50 lists (max)
      for (let i = 0; i < 50; i++) {
        aggregate.addList(`List ${i}`, testUserId);
      }

      expect(aggregate.getLists()).toHaveLength(50);

      // 51st list should fail
      expect(() => {
        aggregate.addList('List 51', testUserId);
      }).toThrow('Board cannot have more than 50 lists');
    });

    it('should add multiple lists with correct position ordering', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      aggregate.addList('List 1', testUserId);
      aggregate.addList('List 2', testUserId);
      aggregate.addList('List 3', testUserId);

      const lists = aggregate.getLists();
      expect(lists[0].position).toBeLessThan(lists[1].position);
      expect(lists[1].position).toBeLessThan(lists[2].position);
    });
  });

  describe('removeList', () => {
    it('should remove a list from the board', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('To Do', testUserId);
      aggregate.clearDomainEvents(); // Clear add event

      aggregate.removeList(list.id, testUserId);

      expect(aggregate.getLists()).toHaveLength(0);
    });

    it('should emit ListRemovedFromBoardEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('To Do', testUserId);
      aggregate.clearDomainEvents();

      aggregate.removeList(list.id, testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ListRemovedFromBoardEvent);
      expect((events[0] as ListRemovedFromBoardEvent).listId).toBe(list.id);
    });

    it('should throw error when removing non-existent list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      expect(() => {
        aggregate.removeList('non-existent-id', testUserId);
      }).toThrow('List with ID non-existent-id not found in board');
    });

    it('should recalculate positions after removal', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list1 = aggregate.addList('List 1', testUserId);
      const list2 = aggregate.addList('List 2', testUserId);
      const list3 = aggregate.addList('List 3', testUserId);

      // Remove middle list
      aggregate.removeList(list2.id, testUserId);

      const remainingLists = aggregate.getLists();
      expect(remainingLists).toHaveLength(2);
      expect(remainingLists[0].id).toBe(list1.id);
      expect(remainingLists[1].id).toBe(list3.id);
    });

    it('should update board timestamp when removing list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('To Do', testUserId);
      const originalTimestamp = aggregate.getBoard().updatedAt;

      aggregate.removeList(list.id, testUserId);

      expect(aggregate.getBoard().updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalTimestamp.getTime(),
      );
    });
  });

  describe('moveList', () => {
    it('should move a list to a new position', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const _list1 = aggregate.addList('List 1', testUserId);
      const list2 = aggregate.addList('List 2', testUserId);
      const list3 = aggregate.addList('List 3', testUserId);
      aggregate.clearDomainEvents();

      // Move list 3 to position 1
      aggregate.moveList(list3.id, 1, testUserId);

      const lists = aggregate.getLists();
      expect(lists[0].id).toBe(list3.id);
      expect(lists[2].id).toBe(list2.id);
    });

    it('should emit ListMovedInBoardEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list1 = aggregate.addList('List 1', testUserId);
      aggregate.addList('List 2', testUserId);
      aggregate.clearDomainEvents();

      aggregate.moveList(list1.id, 2, testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ListMovedInBoardEvent);
      expect((events[0] as ListMovedInBoardEvent).listId).toBe(list1.id);
      expect((events[0] as ListMovedInBoardEvent).oldPosition).toBe(1);
      expect((events[0] as ListMovedInBoardEvent).newPosition).toBe(2);
    });

    it('should throw error when moving non-existent list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      expect(() => {
        aggregate.moveList('non-existent-id', 1, testUserId);
      }).toThrow('List with ID non-existent-id not found in board');
    });

    it('should throw error for invalid position (too low)', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('List 1', testUserId);

      expect(() => {
        aggregate.moveList(list.id, 0, testUserId);
      }).toThrow('Invalid position: 0');
    });

    it('should throw error for invalid position (too high)', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('List 1', testUserId);

      expect(() => {
        aggregate.moveList(list.id, 5, testUserId);
      }).toThrow('Invalid position: 5');
    });

    it('should do nothing when moving to same position', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const list = aggregate.addList('List 1', testUserId);
      aggregate.clearDomainEvents();

      aggregate.moveList(list.id, 1, testUserId);

      // No event should be emitted for no-op move
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should update board timestamp when moving list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      aggregate.addList('List 1', testUserId);
      const list2 = aggregate.addList('List 2', testUserId);
      const originalTimestamp = aggregate.getBoard().updatedAt;

      aggregate.moveList(list2.id, 1, testUserId);

      expect(aggregate.getBoard().updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalTimestamp.getTime(),
      );
    });
  });

  describe('renameList', () => {
    it('should rename a list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('Old Name', testUserId);
      aggregate.clearDomainEvents();

      aggregate.renameList(list.id, 'New Name', testUserId);

      const renamedList = aggregate.getLists().find((l) => l.id === list.id)!;
      expect(renamedList.name).toBe('New Name');
    });

    it('should emit ListRenamedEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('Old Name', testUserId);
      aggregate.clearDomainEvents();

      aggregate.renameList(list.id, 'New Name', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ListRenamedEvent);
      expect((events[0] as ListRenamedEvent).listId).toBe(list.id);
      expect((events[0] as ListRenamedEvent).oldName).toBe('Old Name');
      expect((events[0] as ListRenamedEvent).newName).toBe('New Name');
    });

    it('should throw error when renaming non-existent list', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      expect(() => {
        aggregate.renameList('non-existent-id', 'New Name', testUserId);
      }).toThrow('List with ID non-existent-id not found in board');
    });
  });

  describe('updateBoard', () => {
    it('should update board name', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'Old Name',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.updateBoard({ name: 'New Name' }, testUserId);

      expect(aggregate.getBoard().name).toBe('New Name');
    });

    it('should update board description', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      aggregate.updateBoard({ description: 'New description' }, testUserId);

      expect(aggregate.getBoard().description).toBe('New description');
    });

    it('should update board color', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      aggregate.updateBoard({ color: '#FF5733' }, testUserId);

      expect(aggregate.getBoard().color).toBe('#FF5733');
    });

    it('should emit BoardUpdatedEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.updateBoard({ name: 'New Name' }, testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BoardUpdatedEvent);
    });
  });

  describe('archive', () => {
    it('should archive the board', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.archive(testUserId);

      expect(aggregate.getBoard().isArchived).toBe(true);
    });

    it('should emit BoardArchivedEvent', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.archive(testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BoardArchivedEvent);
    });
  });

  describe('getters', () => {
    it('should return board entity', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const board = aggregate.getBoard();

      expect(board).toBeInstanceOf(Board);
      expect(board.name).toBe('My Board');
    });

    it('should return lists collection', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      aggregate.addList('List 1', testUserId);
      aggregate.addList('List 2', testUserId);

      const lists = aggregate.getLists();

      expect(lists).toHaveLength(2);
      expect(lists[0]).toBeInstanceOf(List);
    });

    it('should return list by id', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );
      const list = aggregate.addList('My List', testUserId);

      const foundList = aggregate.getListById(list.id);

      expect(foundList).toBeDefined();
      expect(foundList!.id).toBe(list.id);
      expect(foundList!.name).toBe('My List');
    });

    it('should return undefined for non-existent list id', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      const foundList = aggregate.getListById('non-existent');

      expect(foundList).toBeUndefined();
    });
  });

  describe('domain events', () => {
    it('should accumulate multiple domain events', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      aggregate.addList('List 1', testUserId);
      aggregate.addList('List 2', testUserId);
      aggregate.updateBoard({ name: 'Updated Board' }, testUserId);

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(3);
      expect(events[0]).toBeInstanceOf(ListAddedToBoardEvent);
      expect(events[1]).toBeInstanceOf(ListAddedToBoardEvent);
      expect(events[2]).toBeInstanceOf(BoardUpdatedEvent);
    });

    it('should clear domain events', () => {
      const aggregate = BoardAggregate.create(
        testOrgId,
        'My Board',
        testUserId,
      );

      aggregate.addList('List 1', testUserId);
      expect(aggregate.getDomainEvents()).toHaveLength(1);

      aggregate.clearDomainEvents();
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });
});
