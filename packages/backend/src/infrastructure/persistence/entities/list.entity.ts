/**
 * T068 - List Entity (TypeORM)
 *
 * Represents a workflow stage column on a board (e.g., "To Do", "In Progress").
 * Entity within Board aggregate.
 *
 * Relationships:
 * - Belongs to Board
 * - Has many Cards (cards in this list)
 *
 * Position Management:
 * - Positions are 0-indexed integers
 * - When list moved, positions recalculated for affected lists
 * - Must be unique within board
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

@Entity('lists')
@Index('IDX_list_board', ['boardId'])
@Index('IDX_list_board_position', ['boardId', 'position'])
@Index('IDX_list_board_archived', ['boardId', 'isArchived'])
export class ListEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  boardId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => BoardEntity, (board) => board.lists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boardId' })
  board!: BoardEntity;

  @OneToMany(() => CardEntity, (card) => card.list, { cascade: true })
  cards!: CardEntity[];
}
