/**
 * Card Aggregate Unit Tests
 *
 * Tests for CardAggregate domain logic, business rules, and invariants.
 * Comprehensive coverage including edge cases and business rule limits.
 */

import { CardAggregate } from '../../../../src/domain/card/card-aggregate';
import { Card } from '../../../../src/domain/card/card.model';
import { Comment } from '../../../../src/domain/comment/comment.model';
import {
  Checklist,
  ChecklistItem,
} from '../../../../src/domain/checklist/checklist.model';
import { Attachment } from '../../../../src/domain/attachment/attachment.model';
import {
  CommentAddedEvent,
  ChecklistAddedEvent,
  ChecklistItemAddedEvent,
  ChecklistItemToggledEvent,
  LabelAppliedEvent,
  LabelRemovedEvent,
  UserAssignedEvent,
  UserUnassignedEvent,
  AttachmentAddedEvent,
  AttachmentRemovedEvent,
  CardDetailsUpdatedEvent,
  CardMovedEvent,
  CardArchivedEvent,
} from '../../../../src/domain/card/events/card-aggregate.events';

describe('CardAggregate', () => {
  const testListId = 'list-123';
  const testUserId = 'user-123';
  const testCardId = 'card-123';

  describe('create', () => {
    it('should create a new card aggregate', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(aggregate).toBeInstanceOf(CardAggregate);
      expect(aggregate.getCard().title).toBe('Test Card');
      expect(aggregate.getCard().listId).toBe(testListId);
      expect(aggregate.getCard().position).toBe(1);
    });

    it('should create card with optional description and due date', () => {
      const dueDate = new Date('2025-12-31');
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
        'Test description',
        dueDate,
      );

      expect(aggregate.getCard().description).toBe('Test description');
      expect(aggregate.getCard().dueDate).toEqual(dueDate);
    });

    it('should initialize with empty collections', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(aggregate.getComments()).toHaveLength(0);
      expect(aggregate.getChecklists()).toHaveLength(0);
      expect(aggregate.getAttachments()).toHaveLength(0);
      expect(aggregate.getLabelIds()).toHaveLength(0);
      expect(aggregate.getAssigneeIds()).toHaveLength(0);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute aggregate from persistence', () => {
      const card = Card.create(
        testCardId,
        testListId,
        'Existing Card',
        1,
        testUserId,
      );
      const comments = [
        Comment.create('comment-1', testCardId, 'Comment 1', testUserId),
        Comment.create('comment-2', testCardId, 'Comment 2', testUserId),
      ];
      const checklists = [
        Checklist.create('checklist-1', testCardId, 'Checklist 1', 1),
      ];

      const aggregate = CardAggregate.reconstitute(
        card,
        comments,
        checklists,
        new Map(),
        [],
        ['label-1', 'label-2'],
        ['user-1', 'user-2'],
      );

      expect(aggregate.getCard().id).toBe(testCardId);
      expect(aggregate.getComments()).toHaveLength(2);
      expect(aggregate.getChecklists()).toHaveLength(1);
      expect(aggregate.getLabelIds()).toHaveLength(2);
      expect(aggregate.getAssigneeIds()).toHaveLength(2);
    });
  });

  describe('updateDetails', () => {
    it('should update card title', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Old Title',
        1,
        testUserId,
      );

      aggregate.updateDetails(testUserId, 'New Title');

      expect(aggregate.getCard().title).toBe('New Title');
    });

    it('should update card description', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.updateDetails(testUserId, undefined, 'New description');

      expect(aggregate.getCard().description).toBe('New description');
    });

    it('should update card due date', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const newDueDate = new Date('2025-12-31');

      aggregate.updateDetails(testUserId, undefined, undefined, newDueDate);

      expect(aggregate.getCard().dueDate).toEqual(newDueDate);
    });

    it('should emit CardDetailsUpdatedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.updateDetails(testUserId, 'New Title');
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CardDetailsUpdatedEvent);
      expect((events[0] as CardDetailsUpdatedEvent).changes.title).toBe(
        'New Title',
      );
    });

    it('should not emit event when no changes', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.updateDetails(testUserId, 'Test Card'); // Same title

      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('moveTo', () => {
    it('should move card to different list', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.moveTo('list-456', 2, testUserId);

      expect(aggregate.getCard().listId).toBe('list-456');
      expect(aggregate.getCard().position).toBe(2);
    });

    it('should emit CardMovedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.moveTo('list-456', 2, testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CardMovedEvent);
      expect((events[0] as CardMovedEvent).newListId).toBe('list-456');
    });

    it('should not emit event when no change', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.moveTo(testListId, 1, testUserId);

      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('addComment', () => {
    it('should add a comment to the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      const comment = aggregate.addComment(
        'comment-1',
        'Test comment',
        testUserId,
      );

      expect(comment).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(aggregate.getComments()).toHaveLength(1);
    });

    it('should emit CommentAddedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      const comment = aggregate.addComment(
        'comment-1',
        'Test comment',
        testUserId,
      );
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CommentAddedEvent);
      expect((events[0] as CommentAddedEvent).commentId).toBe(comment.id);
    });

    it('should enforce MAX_COMMENTS_PER_CARD limit (1000)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      // Add 1000 comments (max)
      for (let i = 0; i < 1000; i++) {
        aggregate.addComment(`comment-${i}`, `Comment ${i}`, testUserId);
      }

      expect(aggregate.getComments()).toHaveLength(1000);

      // 1001st comment should fail
      expect(() => {
        aggregate.addComment('comment-1001', 'Comment 1001', testUserId);
      }).toThrow('Card cannot have more than 1000 comments');
    });

    it('should add multiple comments', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.addComment('comment-1', 'Comment 1', testUserId);
      aggregate.addComment('comment-2', 'Comment 2', testUserId);
      aggregate.addComment('comment-3', 'Comment 3', testUserId);

      expect(aggregate.getComments()).toHaveLength(3);
    });
  });

  describe('addChecklist', () => {
    it('should add a checklist to the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');

      expect(checklist).toBeDefined();
      expect(checklist.name).toBe('My Checklist');
      expect(aggregate.getChecklists()).toHaveLength(1);
    });

    it('should emit ChecklistAddedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ChecklistAddedEvent);
      expect((events[0] as ChecklistAddedEvent).checklistId).toBe(checklist.id);
    });

    it('should enforce MAX_CHECKLISTS_PER_CARD limit (20)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      // Add 20 checklists (max)
      for (let i = 0; i < 20; i++) {
        aggregate.addChecklist(`checklist-${i}`, `Checklist ${i}`);
      }

      expect(aggregate.getChecklists()).toHaveLength(20);

      // 21st checklist should fail
      expect(() => {
        aggregate.addChecklist('checklist-21', 'Checklist 21');
      }).toThrow('Card cannot have more than 20 checklists');
    });
  });

  describe('addChecklistItem', () => {
    it('should add an item to a checklist', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      aggregate.clearDomainEvents();

      const item = aggregate.addChecklistItem(checklist.id, 'item-1', 'Task 1');

      expect(item).toBeDefined();
      expect(item.text).toBe('Task 1');
      expect(aggregate.getChecklistItems(checklist.id)).toHaveLength(1);
    });

    it('should emit ChecklistItemAddedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      aggregate.clearDomainEvents();

      const item = aggregate.addChecklistItem(checklist.id, 'item-1', 'Task 1');
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ChecklistItemAddedEvent);
    });

    it('should throw error for non-existent checklist', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(() => {
        aggregate.addChecklistItem('non-existent', 'item-1', 'Task 1');
      }).toThrow('Checklist not found');
    });

    it('should enforce MAX_CHECKLIST_ITEMS limit (100)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');

      // Add 100 items (max)
      for (let i = 0; i < 100; i++) {
        aggregate.addChecklistItem(checklist.id, `item-${i}`, `Task ${i}`);
      }

      expect(aggregate.getChecklistItems(checklist.id)).toHaveLength(100);

      // 101st item should fail
      expect(() => {
        aggregate.addChecklistItem(checklist.id, 'item-101', 'Task 101');
      }).toThrow('Checklist cannot have more than 100 items');
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle checklist item completion status', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      const item = aggregate.addChecklistItem(checklist.id, 'item-1', 'Task 1');
      aggregate.clearDomainEvents();

      aggregate.toggleChecklistItem(checklist.id, item.id);

      const items = aggregate.getChecklistItems(checklist.id);
      expect(items[0].isCompleted).toBe(true);
    });

    it('should emit ChecklistItemToggledEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      const item = aggregate.addChecklistItem(checklist.id, 'item-1', 'Task 1');
      aggregate.clearDomainEvents();

      aggregate.toggleChecklistItem(checklist.id, item.id);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ChecklistItemToggledEvent);
    });

    it('should toggle item back to incomplete', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');
      const item = aggregate.addChecklistItem(checklist.id, 'item-1', 'Task 1');

      aggregate.toggleChecklistItem(checklist.id, item.id); // Complete
      aggregate.toggleChecklistItem(checklist.id, item.id); // Incomplete

      const items = aggregate.getChecklistItems(checklist.id);
      expect(items[0].isCompleted).toBe(false);
    });

    it('should throw error for non-existent checklist', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(() => {
        aggregate.toggleChecklistItem('non-existent', 'item-1');
      }).toThrow('Checklist not found');
    });

    it('should throw error for non-existent item', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const checklist = aggregate.addChecklist('checklist-1', 'My Checklist');

      expect(() => {
        aggregate.toggleChecklistItem(checklist.id, 'non-existent');
      }).toThrow('Checklist item not found');
    });
  });

  describe('applyLabel', () => {
    it('should apply a label to the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.applyLabel('label-1', testUserId);

      expect(aggregate.getLabelIds()).toContain('label-1');
    });

    it('should emit LabelAppliedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.applyLabel('label-1', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LabelAppliedEvent);
      expect((events[0] as LabelAppliedEvent).labelId).toBe('label-1');
    });

    it('should prevent duplicate labels', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.applyLabel('label-1', testUserId);
      aggregate.applyLabel('label-1', testUserId); // Should not throw, returns early

      expect(aggregate.getLabelIds()).toHaveLength(1);
    });

    it('should enforce MAX_LABELS_PER_CARD limit (10)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      // Add 10 labels (max)
      for (let i = 0; i < 10; i++) {
        aggregate.applyLabel(`label-${i}`, testUserId);
      }

      expect(aggregate.getLabelIds()).toHaveLength(10);

      // 11th label should fail
      expect(() => {
        aggregate.applyLabel('label-11', testUserId);
      }).toThrow('Card cannot have more than 10 labels');
    });
  });

  describe('removeLabel', () => {
    it('should remove a label from the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      aggregate.applyLabel('label-1', testUserId);
      aggregate.clearDomainEvents();

      aggregate.removeLabel('label-1', testUserId);

      expect(aggregate.getLabelIds()).not.toContain('label-1');
    });

    it('should emit LabelRemovedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      aggregate.applyLabel('label-1', testUserId);
      aggregate.clearDomainEvents();

      aggregate.removeLabel('label-1', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LabelRemovedEvent);
    });

    it('should throw error when removing non-existent label', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(() => {
        aggregate.removeLabel('non-existent', testUserId);
      }).toThrow('Label not applied to this card');
    });
  });

  describe('assignUser', () => {
    it('should assign a user to the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.assignUser('user-456', testUserId);

      expect(aggregate.getAssigneeIds()).toContain('user-456');
    });

    it('should emit UserAssignedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.assignUser('user-456', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserAssignedEvent);
      expect((events[0] as UserAssignedEvent).userId).toBe('user-456');
    });

    it('should prevent duplicate assignments', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.assignUser('user-456', testUserId);
      aggregate.assignUser('user-456', testUserId); // Should not throw, returns early

      expect(aggregate.getAssigneeIds()).toHaveLength(1);
    });

    it('should enforce MAX_ASSIGNEES_PER_CARD limit (20)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      // Add 20 assignees (max)
      for (let i = 0; i < 20; i++) {
        aggregate.assignUser(`user-${i}`, testUserId);
      }

      expect(aggregate.getAssigneeIds()).toHaveLength(20);

      // 21st assignee should fail
      expect(() => {
        aggregate.assignUser('user-21', testUserId);
      }).toThrow('Card cannot have more than 20 assignees');
    });
  });

  describe('unassignUser', () => {
    it('should unassign a user from the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      aggregate.assignUser('user-456', testUserId);
      aggregate.clearDomainEvents();

      aggregate.unassignUser('user-456', testUserId);

      expect(aggregate.getAssigneeIds()).not.toContain('user-456');
    });

    it('should emit UserUnassignedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      aggregate.assignUser('user-456', testUserId);
      aggregate.clearDomainEvents();

      aggregate.unassignUser('user-456', testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserUnassignedEvent);
    });

    it('should throw error when unassigning non-assigned user', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(() => {
        aggregate.unassignUser('user-456', testUserId);
      }).toThrow('User not assigned to this card');
    });
  });

  describe('addAttachment', () => {
    it('should add an attachment to the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      const attachment = aggregate.addAttachment(
        'attachment-1',
        'file.pdf',
        '/storage/file.pdf',
        'https://example.com/file.pdf',
        1024,
        'application/pdf',
        testUserId,
      );

      expect(attachment).toBeDefined();
      expect(attachment.filename).toBe('file.pdf');
      expect(aggregate.getAttachments()).toHaveLength(1);
    });

    it('should emit AttachmentAddedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.addAttachment(
        'attachment-1',
        'file.pdf',
        '/storage/file.pdf',
        'https://example.com/file.pdf',
        1024,
        'application/pdf',
        testUserId,
      );
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AttachmentAddedEvent);
    });

    it('should enforce MAX_ATTACHMENTS_PER_CARD limit (50)', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      // Add 50 attachments (max)
      for (let i = 0; i < 50; i++) {
        aggregate.addAttachment(
          `attachment-${i}`,
          `file-${i}.pdf`,
          `/storage/file-${i}.pdf`,
          `https://example.com/file-${i}.pdf`,
          1024,
          'application/pdf',
          testUserId,
        );
      }

      expect(aggregate.getAttachments()).toHaveLength(50);

      // 51st attachment should fail
      expect(() => {
        aggregate.addAttachment(
          'attachment-51',
          'file-51.pdf',
          '/storage/file-51.pdf',
          'https://example.com/file-51.pdf',
          1024,
          'application/pdf',
          testUserId,
        );
      }).toThrow('Card cannot have more than 50 attachments');
    });
  });

  describe('removeAttachment', () => {
    it('should remove an attachment from the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const attachment = aggregate.addAttachment(
        'attachment-1',
        'file.pdf',
        '/storage/file.pdf',
        'https://example.com/file.pdf',
        1024,
        'application/pdf',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.removeAttachment(attachment.id, testUserId);

      expect(aggregate.getAttachments()).toHaveLength(0);
    });

    it('should emit AttachmentRemovedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );
      const attachment = aggregate.addAttachment(
        'attachment-1',
        'file.pdf',
        '/storage/file.pdf',
        'https://example.com/file.pdf',
        1024,
        'application/pdf',
        testUserId,
      );
      aggregate.clearDomainEvents();

      aggregate.removeAttachment(attachment.id, testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AttachmentRemovedEvent);
    });

    it('should throw error when removing non-existent attachment', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      expect(() => {
        aggregate.removeAttachment('non-existent', testUserId);
      }).toThrow('Attachment not found');
    });
  });

  describe('archive', () => {
    it('should archive the card', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.archive(testUserId);

      expect(aggregate.getCard().isArchived).toBe(true);
    });

    it('should emit CardArchivedEvent', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.archive(testUserId);
      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CardArchivedEvent);
    });
  });

  describe('domain events', () => {
    it('should accumulate multiple domain events', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.addComment('comment-1', 'Comment 1', testUserId);
      aggregate.addChecklist('checklist-1', 'Checklist 1');
      aggregate.applyLabel('label-1', testUserId);
      aggregate.assignUser('user-456', testUserId);

      const events = aggregate.getDomainEvents();
      expect(events).toHaveLength(4);
    });

    it('should clear domain events', () => {
      const aggregate = CardAggregate.create(
        testCardId,
        testListId,
        'Test Card',
        1,
        testUserId,
      );

      aggregate.addComment('comment-1', 'Comment 1', testUserId);
      expect(aggregate.getDomainEvents()).toHaveLength(1);

      aggregate.clearDomainEvents();
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });
  });
});
