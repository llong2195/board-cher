import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { ChecklistEntity } from './checklist.entity';

/**
 * ChecklistItem Entity (T128)
 *
 * Represents an individual item within a checklist. Items can be
 * marked as complete or incomplete.
 *
 * Relations:
 * - Many items belong to one checklist
 *
 * Position Management:
 * - Items are ordered by position within checklist
 */
@Entity('checklist_items')
@Index(['checklistId'])
@Index(['checklistId', 'position'])
export class ChecklistItemEntity extends BaseEntity {
  /**
   * The checklist this item belongs to
   */
  @Column('uuid')
  checklistId!: string;

  @ManyToOne(() => ChecklistEntity, (checklist) => checklist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklistId' })
  checklist!: ChecklistEntity;

  /**
   * Item text/description
   * Max length: 200 characters
   */
  @Column('varchar', { length: 200 })
  text!: string;

  /**
   * Whether this item is completed
   */
  @Column('boolean', { default: false })
  isCompleted!: boolean;

  /**
   * Position within checklist (for ordering)
   */
  @Column('int', { default: 0 })
  position!: number;
}
