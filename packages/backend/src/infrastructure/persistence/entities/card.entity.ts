/**
 * T069 - Card Entity (TypeORM)
 *
 * Represents a work item or task on the board.
 * Implements the Card aggregate root from the data model.
 *
 * Relationships:
 * - Belongs to List
 * - Created by User
 * - Has many Comments, Attachments, Labels, Assignments, Checklists
 *
 * Position Management:
 * - Positions are 0-indexed integers within list
 * - When card moved between lists, position updated in both source and target
 * - Must be unique within list
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ListEntity } from './list.entity';
import { UserEntity } from './user.entity';

@Entity('cards')
@Index('IDX_card_list', ['listId'])
@Index('IDX_card_list_position', ['listId', 'position'])
@Index('IDX_card_list_archived', ['listId', 'isArchived'])
@Index('IDX_card_created_by', ['createdBy'])
@Index('IDX_card_due_date', ['dueDate'])
@Index('IDX_card_updated_at', ['updatedAt'])
export class CardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listId!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'timestamp', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => ListEntity, (list) => list.cards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listId' })
  list!: ListEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator!: UserEntity;

  // US2 Relations - Card Details
  @OneToMany('CommentEntity', 'card', { lazy: true })
  comments!: Promise<any[]>;

  @OneToMany('AttachmentEntity', 'card', { lazy: true })
  attachments!: Promise<any[]>;

  @ManyToMany('LabelEntity', 'cards', { lazy: true })
  labels!: Promise<any[]>;

  @OneToMany('ChecklistEntity', 'card', { lazy: true })
  checklists!: Promise<any[]>;
}
