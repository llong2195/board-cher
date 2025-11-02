import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CardEntity } from './card.entity';
import { ChecklistItemEntity } from './checklist-item.entity';

/**
 * Checklist Entity (T127)
 *
 * Represents a checklist (task list) within a card. A card can have
 * multiple checklists, each containing checklist items.
 *
 * Relations:
 * - Many checklists belong to one card
 * - One checklist has many checklist items
 *
 * Progress Calculation:
 * - Dynamically calculated from items: completedItems / totalItems
 */
@Entity('checklists')
@Index(['cardId'])
export class ChecklistEntity extends BaseEntity {
  /**
   * The card this checklist belongs to
   */
  @Column('uuid')
  cardId: string;

  @ManyToOne(() => CardEntity, (card) => card.checklists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cardId' })
  card: CardEntity;

  /**
   * Checklist name/title
   * Max length: 100 characters
   */
  @Column('varchar', { length: 100 })
  name: string;

  /**
   * Position within card (for ordering multiple checklists)
   */
  @Column('int', { default: 0 })
  position: number;

  /**
   * Checklist items
   */
  @OneToMany(() => ChecklistItemEntity, (item) => item.checklist, {
    cascade: true,
  })
  items: ChecklistItemEntity[];
}
