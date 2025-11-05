/**
 * Card Aggregate Root
 *
 * Manages the Card entity and all its child entities (comments, attachments,
 * checklists, labels, assignments) as a single transactional consistency boundary.
 *
 * Based on DDD principles:
 * - Enforces business rules and invariants
 * - Emits domain events for state changes
 * - Provides clear API for card operations
 */

import { AggregateRoot } from '../shared/aggregate-root';
import { Card } from './card.model';
import { Comment } from '../comment/comment.model';
import { Checklist, ChecklistItem } from '../checklist/checklist.model';
import { Attachment } from '../attachment/attachment.model';
import {
  CommentAddedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  ChecklistAddedEvent,
  ChecklistItemAddedEvent,
  ChecklistItemToggledEvent,
  ChecklistDeletedEvent,
  LabelAppliedEvent,
  LabelRemovedEvent,
  UserAssignedEvent,
  UserUnassignedEvent,
  AttachmentAddedEvent,
  AttachmentRemovedEvent,
  CardDetailsUpdatedEvent,
  CardMovedEvent,
  CardArchivedEvent,
} from './events/card-aggregate.events';

// Business rule constants
const MAX_COMMENTS_PER_CARD = 1000;
const MAX_ATTACHMENTS_PER_CARD = 50;
const MAX_CHECKLISTS_PER_CARD = 20;
const MAX_LABELS_PER_CARD = 10;
const MAX_ASSIGNEES_PER_CARD = 20;
const MAX_CHECKLIST_ITEMS_PER_CHECKLIST = 100;

export class CardAggregate extends AggregateRoot {
  private card: Card;
  private comments: Comment[] = [];
  private checklists: Checklist[] = [];
  private checklistItems: Map<string, ChecklistItem[]> = new Map();
  private attachments: Attachment[] = [];
  private labelIds: Set<string> = new Set();
  private assigneeIds: Set<string> = new Set();

  private constructor(card: Card) {
    super();
    this.card = card;
  }

  /**
   * Create a new Card aggregate
   */
  static create(
    id: string,
    listId: string,
    title: string,
    position: number,
    createdBy: string,
    description: string | null = null,
    dueDate: Date | null = null,
  ): CardAggregate {
    const card = Card.create(
      id,
      listId,
      title,
      position,
      createdBy,
      description,
      dueDate,
    );
    return new CardAggregate(card);
  }

  /**
   * Reconstitute Card aggregate from persistence
   */
  static reconstitute(
    card: Card,
    comments: Comment[] = [],
    checklists: Checklist[] = [],
    checklistItems: Map<string, ChecklistItem[]> = new Map(),
    attachments: Attachment[] = [],
    labelIds: string[] = [],
    assigneeIds: string[] = [],
  ): CardAggregate {
    const aggregate = new CardAggregate(card);
    aggregate.comments = comments;
    aggregate.checklists = checklists;
    aggregate.checklistItems = checklistItems;
    aggregate.attachments = attachments;
    aggregate.labelIds = new Set(labelIds);
    aggregate.assigneeIds = new Set(assigneeIds);
    return aggregate;
  }

  // ============================================================================
  // Card Operations
  // ============================================================================

  /**
   * Update card details (title, description, due date)
   */
  updateDetails(
    userId: string,
    title?: string,
    description?: string | null,
    dueDate?: Date | null,
  ): void {
    const changes: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
    } = {};

    if (title !== undefined && title !== this.card.title) {
      changes.title = title;
    }
    if (description !== undefined && description !== this.card.description) {
      changes.description = description ?? undefined;
    }
    if (dueDate !== undefined && dueDate !== this.card.dueDate) {
      changes.dueDate = dueDate;
    }

    if (Object.keys(changes).length > 0) {
      this.card.update(title, description, dueDate);
      this.addDomainEvent(
        new CardDetailsUpdatedEvent(this.card.id, changes, userId),
      );
    }
  }

  /**
   * Move card to different list and/or position
   */
  moveTo(newListId: string, newPosition: number, userId: string): void {
    const oldListId = this.card.listId;
    const oldPosition = this.card.position;

    if (newListId === oldListId && newPosition === oldPosition) {
      return; // No change
    }

    this.card.moveTo(newListId, newPosition);
    this.addDomainEvent(
      new CardMovedEvent(
        this.card.id,
        oldListId,
        newListId,
        oldPosition,
        newPosition,
        userId,
      ),
    );
  }

  /**
   * Archive the card
   */
  archive(userId: string): void {
    this.card.archive();
    this.addDomainEvent(new CardArchivedEvent(this.card.id, userId));
  }

  // ============================================================================
  // Comment Operations
  // ============================================================================

  /**
   * Add a comment to the card
   */
  addComment(commentId: string, content: string, userId: string): Comment {
    if (this.comments.length >= MAX_COMMENTS_PER_CARD) {
      throw new Error(
        `Card cannot have more than ${MAX_COMMENTS_PER_CARD} comments`,
      );
    }

    const comment = Comment.create(commentId, this.card.id, userId, content);
    this.comments.push(comment);
    this.card.addComment(commentId);

    this.addDomainEvent(
      new CommentAddedEvent(this.card.id, commentId, content, userId),
    );
    return comment;
  }

  /**
   * Update a comment
   */
  updateComment(commentId: string, newContent: string, userId: string): void {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Only comment author can update the comment');
    }

    const oldContent = comment.content;
    comment.edit(newContent);

    if (oldContent !== newContent) {
      this.addDomainEvent(
        new CommentUpdatedEvent(this.card.id, commentId, newContent, userId),
      );
    }
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string, userId: string): void {
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      throw new Error('Comment not found');
    }

    const comment = this.comments[index];
    if (comment.userId !== userId) {
      throw new Error('Only comment author can delete the comment');
    }

    this.comments.splice(index, 1);
    this.card.removeComment(commentId);

    this.addDomainEvent(
      new CommentDeletedEvent(this.card.id, commentId, userId),
    );
  }

  // ============================================================================
  // Checklist Operations
  // ============================================================================

  /**
   * Add a checklist to the card
   */
  addChecklist(checklistId: string, title: string): Checklist {
    if (this.checklists.length >= MAX_CHECKLISTS_PER_CARD) {
      throw new Error(
        `Card cannot have more than ${MAX_CHECKLISTS_PER_CARD} checklists`,
      );
    }

    const position = this.checklists.length + 1;
    const checklist = Checklist.create(
      checklistId,
      this.card.id,
      title,
      position,
    );
    this.checklists.push(checklist);
    this.checklistItems.set(checklistId, []);
    this.card.addChecklist(checklistId);

    this.addDomainEvent(
      new ChecklistAddedEvent(this.card.id, checklistId, title),
    );
    return checklist;
  }

  /**
   * Add an item to a checklist
   */
  addChecklistItem(
    checklistId: string,
    itemId: string,
    text: string,
  ): ChecklistItem {
    const checklist = this.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const items = this.checklistItems.get(checklistId) || [];
    if (items.length >= MAX_CHECKLIST_ITEMS_PER_CHECKLIST) {
      throw new Error(
        `Checklist cannot have more than ${MAX_CHECKLIST_ITEMS_PER_CHECKLIST} items`,
      );
    }

    const position = items.length + 1;
    const item = ChecklistItem.create(itemId, text, position);
    items.push(item);
    this.checklistItems.set(checklistId, items);

    this.addDomainEvent(
      new ChecklistItemAddedEvent(this.card.id, checklistId, itemId, text),
    );
    return item;
  }

  /**
   * Toggle checklist item completion status
   */
  toggleChecklistItem(checklistId: string, itemId: string): void {
    const checklist = this.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const items = this.checklistItems.get(checklistId) || [];
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Checklist item not found');
    }

    item.toggle();

    this.addDomainEvent(
      new ChecklistItemToggledEvent(
        this.card.id,
        checklistId,
        itemId,
        item.isCompleted,
      ),
    );
  }

  /**
   * Delete a checklist
   */
  deleteChecklist(checklistId: string): void {
    const index = this.checklists.findIndex((c) => c.id === checklistId);
    if (index === -1) {
      throw new Error('Checklist not found');
    }

    this.checklists.splice(index, 1);
    this.checklistItems.delete(checklistId);
    this.card.removeChecklist(checklistId);

    this.addDomainEvent(new ChecklistDeletedEvent(this.card.id, checklistId));
  }

  // ============================================================================
  // Label Operations
  // ============================================================================

  /**
   * Apply a label to the card
   */
  applyLabel(labelId: string, userId: string): void {
    if (this.labelIds.has(labelId)) {
      return; // Already applied
    }

    if (this.labelIds.size >= MAX_LABELS_PER_CARD) {
      throw new Error(
        `Card cannot have more than ${MAX_LABELS_PER_CARD} labels`,
      );
    }

    this.labelIds.add(labelId);
    this.card.addLabel(labelId);

    this.addDomainEvent(new LabelAppliedEvent(this.card.id, labelId, userId));
  }

  /**
   * Remove a label from the card
   */
  removeLabel(labelId: string, userId: string): void {
    if (!this.labelIds.has(labelId)) {
      throw new Error('Label not applied to this card');
    }

    this.labelIds.delete(labelId);
    this.card.removeLabel(labelId);

    this.addDomainEvent(new LabelRemovedEvent(this.card.id, labelId, userId));
  }

  // ============================================================================
  // Assignment Operations
  // ============================================================================

  /**
   * Assign a user to the card
   */
  assignUser(userId: string, assignedBy: string): void {
    if (this.assigneeIds.has(userId)) {
      return; // Already assigned
    }

    if (this.assigneeIds.size >= MAX_ASSIGNEES_PER_CARD) {
      throw new Error(
        `Card cannot have more than ${MAX_ASSIGNEES_PER_CARD} assignees`,
      );
    }

    this.assigneeIds.add(userId);
    this.card.addAssignee(userId);

    this.addDomainEvent(
      new UserAssignedEvent(this.card.id, userId, assignedBy),
    );
  }

  /**
   * Unassign a user from the card
   */
  unassignUser(userId: string, unassignedBy: string): void {
    if (!this.assigneeIds.has(userId)) {
      throw new Error('User not assigned to this card');
    }

    this.assigneeIds.delete(userId);
    this.card.removeAssignee(userId);

    this.addDomainEvent(
      new UserUnassignedEvent(this.card.id, userId, unassignedBy),
    );
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * Add an attachment to the card
   */
  addAttachment(
    attachmentId: string,
    filename: string,
    storagePath: string,
    url: string,
    size: number,
    mimeType: string,
    userId: string,
  ): Attachment {
    if (this.attachments.length >= MAX_ATTACHMENTS_PER_CARD) {
      throw new Error(
        `Card cannot have more than ${MAX_ATTACHMENTS_PER_CARD} attachments`,
      );
    }

    const attachment = Attachment.create(
      attachmentId,
      this.card.id,
      userId,
      filename,
      filename,
      mimeType,
      size,
      storagePath,
      url,
    );
    this.attachments.push(attachment);
    this.card.addAttachment(attachmentId);

    this.addDomainEvent(
      new AttachmentAddedEvent(
        this.card.id,
        attachmentId,
        filename,
        size,
        userId,
      ),
    );
    return attachment;
  }

  /**
   * Remove an attachment from the card
   */
  removeAttachment(attachmentId: string, userId: string): void {
    const index = this.attachments.findIndex((a) => a.id === attachmentId);
    if (index === -1) {
      throw new Error('Attachment not found');
    }

    this.attachments.splice(index, 1);
    this.card.removeAttachment(attachmentId);

    this.addDomainEvent(
      new AttachmentRemovedEvent(this.card.id, attachmentId, userId),
    );
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getCard(): Card {
    return this.card;
  }

  getComments(): Comment[] {
    return [...this.comments];
  }

  getChecklists(): Checklist[] {
    return [...this.checklists];
  }

  getChecklistItems(checklistId: string): ChecklistItem[] {
    return [...(this.checklistItems.get(checklistId) || [])];
  }

  getAttachments(): Attachment[] {
    return [...this.attachments];
  }

  getLabelIds(): string[] {
    return Array.from(this.labelIds);
  }

  getAssigneeIds(): string[] {
    return Array.from(this.assigneeIds);
  }
}
