/**
 * T247 - Activity Entity (TypeORM)
 *
 * Represents an audit log entry for actions performed on boards or cards.
 * Provides chronological activity feed showing all changes with actor, timestamp, and description.
 *
 * Relationships:
 * - Belongs to User (actor)
 * - Optionally belongs to Board (board-level actions)
 * - Optionally belongs to Card (card-level actions)
 *
 * Action Types: BOARD_*, LIST_*, CARD_*, COMMENT_*, ATTACHMENT_*, LABEL_*, MEMBER_*, CHECKLIST_*, DUE_DATE_*
 * Entity Types: BOARD, LIST, CARD, COMMENT, ATTACHMENT, LABEL, CHECKLIST, USER
 *
 * Validation Rules:
 * - Must have either boardId or cardId (or both)
 * - actionType must be valid enum
 * - entityType must be valid enum
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

/**
 * Enum for action types performed in the system
 */
export enum ActivityActionType {
  // Board actions
  BOARD_CREATED = 'BOARD_CREATED',
  BOARD_UPDATED = 'BOARD_UPDATED',
  BOARD_DELETED = 'BOARD_DELETED',
  BOARD_ARCHIVED = 'BOARD_ARCHIVED',

  // List actions
  LIST_CREATED = 'LIST_CREATED',
  LIST_UPDATED = 'LIST_UPDATED',
  LIST_MOVED = 'LIST_MOVED',
  LIST_DELETED = 'LIST_DELETED',
  LIST_ARCHIVED = 'LIST_ARCHIVED',

  // Card actions
  CARD_CREATED = 'CARD_CREATED',
  CARD_UPDATED = 'CARD_UPDATED',
  CARD_MOVED = 'CARD_MOVED',
  CARD_DELETED = 'CARD_DELETED',
  CARD_ARCHIVED = 'CARD_ARCHIVED',

  // Comment actions
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_EDITED = 'COMMENT_EDITED',
  COMMENT_DELETED = 'COMMENT_DELETED',

  // Attachment actions
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_DELETED = 'ATTACHMENT_DELETED',

  // Label actions
  LABEL_ADDED = 'LABEL_ADDED',
  LABEL_REMOVED = 'LABEL_REMOVED',
  LABEL_CREATED = 'LABEL_CREATED',
  LABEL_DELETED = 'LABEL_DELETED',

  // Member/Assignment actions
  MEMBER_ASSIGNED = 'MEMBER_ASSIGNED',
  MEMBER_UNASSIGNED = 'MEMBER_UNASSIGNED',

  // Checklist actions
  CHECKLIST_CREATED = 'CHECKLIST_CREATED',
  CHECKLIST_ITEM_CHECKED = 'CHECKLIST_ITEM_CHECKED',
  CHECKLIST_ITEM_UNCHECKED = 'CHECKLIST_ITEM_UNCHECKED',

  // Due date actions
  DUE_DATE_SET = 'DUE_DATE_SET',
  DUE_DATE_REMOVED = 'DUE_DATE_REMOVED',
}

/**
 * Enum for entity types affected by actions
 */
export enum ActivityEntityType {
  BOARD = 'BOARD',
  LIST = 'LIST',
  CARD = 'CARD',
  COMMENT = 'COMMENT',
  ATTACHMENT = 'ATTACHMENT',
  LABEL = 'LABEL',
  CHECKLIST = 'CHECKLIST',
  USER = 'USER',
}

@Entity('activities')
@Index('IDX_activity_board_created', ['boardId', 'createdAt'])
@Index('IDX_activity_card_created', ['cardId', 'createdAt'])
@Index('IDX_activity_user', ['userId'])
@Index('IDX_activity_entity', ['entityType', 'entityId', 'createdAt'])
@Index('IDX_activity_created_at', ['createdAt'])
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  boardId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  cardId!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    enum: ActivityActionType,
  })
  actionType!: ActivityActionType;

  @Column({
    type: 'varchar',
    length: 50,
    enum: ActivityEntityType,
  })
  entityType!: ActivityEntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => BoardEntity, { nullable: true })
  @JoinColumn({ name: 'boardId' })
  board!: BoardEntity | null;

  @ManyToOne(() => CardEntity, { nullable: true })
  @JoinColumn({ name: 'cardId' })
  card!: CardEntity | null;
}
