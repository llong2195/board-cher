import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

/**
 * Label Entity (T125)
 *
 * Represents a label (tag) that can be applied to cards for categorization.
 * Labels are board-level resources that can be assigned to multiple cards.
 *
 * Relations:
 * - Many labels belong to one board
 * - Many labels can be assigned to many cards (many-to-many)
 *
 * Validation:
 * - Color must be one of 10 predefined colors
 * - Name must be unique within board
 * - Name can be empty (color-only label)
 */
@Entity('labels')
@Index(['boardId'])
@Index(['boardId', 'name'], { unique: true })
export class LabelEntity extends BaseEntity {
  /**
   * The board this label belongs to
   */
  @Column('uuid')
  boardId!: string;

  @ManyToOne(() => BoardEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boardId' })
  board!: BoardEntity;

  /**
   * Label name (optional - can have color-only labels)
   * Max length: 50 characters
   */
  @Column('varchar', { length: 50, nullable: true })
  name!: string | null;

  /**
   * Label color from predefined palette:
   * green, yellow, orange, red, purple, blue, sky, lime, pink, black
   */
  @Column('varchar', { length: 20 })
  color!: string;

  /**
   * Cards that have this label assigned
   */
  @ManyToMany(() => CardEntity, (card) => card.labels)
  @JoinTable({
    name: 'card_labels',
    joinColumn: { name: 'labelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cardId', referencedColumnName: 'id' },
  })
  cards!: CardEntity[];
}
