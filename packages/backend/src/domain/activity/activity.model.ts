/**
 * T249 - Activity Domain Model
 *
 * Represents an audit log entry for actions performed on boards or cards.
 * Provides chronological activity feed showing all changes with actor, timestamp, and description.
 *
 * This is a value object in the DDD context - immutable once created.
 * Activities are created by the ActivityLogger service when domain events occur.
 */

import {
  ActivityActionType,
  ActivityEntityType,
} from '../../infrastructure/persistence/entities/activity.entity';

export class Activity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly boardId: string | null,
    public readonly cardId: string | null,
    public readonly actionType: ActivityActionType,
    public readonly entityType: ActivityEntityType,
    public readonly entityId: string,
    public readonly metadata: Record<string, any> | null,
    public readonly createdAt: Date,
  ) {
    this.validate();
  }

  /**
   * Create a new Activity instance
   */
  static create(
    id: string,
    userId: string,
    actionType: ActivityActionType,
    entityType: ActivityEntityType,
    entityId: string,
    boardId: string | null = null,
    cardId: string | null = null,
    metadata: Record<string, any> | null = null,
  ): Activity {
    return new Activity(
      id,
      userId,
      boardId,
      cardId,
      actionType,
      entityType,
      entityId,
      metadata,
      new Date(),
    );
  }

  /**
   * Validate activity data
   */
  private validate(): void {
    // Must have either boardId or cardId (or both)
    if (!this.boardId && !this.cardId) {
      throw new Error('Activity must have either boardId or cardId (or both)');
    }

    // ActionType must be valid
    if (
      !Object.values(ActivityActionType).includes(
        this.actionType as ActivityActionType,
      )
    ) {
      throw new Error(`Invalid actionType: ${this.actionType}`);
    }

    // EntityType must be valid
    if (
      !Object.values(ActivityEntityType).includes(
        this.entityType as ActivityEntityType,
      )
    ) {
      throw new Error(`Invalid entityType: ${this.entityType}`);
    }

    // EntityId must be present
    if (!this.entityId || this.entityId.trim() === '') {
      throw new Error('entityId is required');
    }

    // UserId must be present
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('userId is required');
    }
  }

  /**
   * Get human-readable description of the activity
   */
  getDescription(): string {
    const actionDescriptions: Record<ActivityActionType, string> = {
      [ActivityActionType.BOARD_CREATED]: 'created the board',
      [ActivityActionType.BOARD_UPDATED]: 'updated the board',
      [ActivityActionType.BOARD_DELETED]: 'deleted the board',
      [ActivityActionType.BOARD_ARCHIVED]: 'archived the board',

      [ActivityActionType.LIST_CREATED]: 'created list',
      [ActivityActionType.LIST_UPDATED]: 'updated list',
      [ActivityActionType.LIST_MOVED]: 'moved list',
      [ActivityActionType.LIST_DELETED]: 'deleted list',
      [ActivityActionType.LIST_ARCHIVED]: 'archived list',

      [ActivityActionType.CARD_CREATED]: 'created card',
      [ActivityActionType.CARD_UPDATED]: 'updated card',
      [ActivityActionType.CARD_MOVED]: 'moved card',
      [ActivityActionType.CARD_DELETED]: 'deleted card',
      [ActivityActionType.CARD_ARCHIVED]: 'archived card',

      [ActivityActionType.COMMENT_ADDED]: 'added a comment',
      [ActivityActionType.COMMENT_EDITED]: 'edited a comment',
      [ActivityActionType.COMMENT_DELETED]: 'deleted a comment',

      [ActivityActionType.ATTACHMENT_ADDED]: 'attached a file',
      [ActivityActionType.ATTACHMENT_DELETED]: 'removed an attachment',

      [ActivityActionType.LABEL_ADDED]: 'added a label',
      [ActivityActionType.LABEL_REMOVED]: 'removed a label',
      [ActivityActionType.LABEL_CREATED]: 'created a label',
      [ActivityActionType.LABEL_DELETED]: 'deleted a label',

      [ActivityActionType.MEMBER_ASSIGNED]: 'assigned a member',
      [ActivityActionType.MEMBER_UNASSIGNED]: 'unassigned a member',

      [ActivityActionType.CHECKLIST_CREATED]: 'created a checklist',
      [ActivityActionType.CHECKLIST_ITEM_CHECKED]: 'checked a checklist item',
      [ActivityActionType.CHECKLIST_ITEM_UNCHECKED]:
        'unchecked a checklist item',

      [ActivityActionType.DUE_DATE_SET]: 'set the due date',
      [ActivityActionType.DUE_DATE_REMOVED]: 'removed the due date',
    };

    let description =
      actionDescriptions[this.actionType] || 'performed an action';

    // Add metadata details if available
    if (this.metadata) {
      if (this.metadata.name) {
        description += ` "${this.metadata.name}"`;
      }
      if (this.metadata.from && this.metadata.to) {
        description += ` from "${this.metadata.from}" to "${this.metadata.to}"`;
      }
      if (this.metadata.filename) {
        description += ` "${this.metadata.filename}"`;
      }
    }

    return description;
  }

  /**
   * Check if this activity is related to a board
   */
  isBoardActivity(): boolean {
    return this.boardId !== null;
  }

  /**
   * Check if this activity is related to a card
   */
  isCardActivity(): boolean {
    return this.cardId !== null;
  }
}
