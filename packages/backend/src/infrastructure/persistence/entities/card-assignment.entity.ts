/**
 * CardAssignment Entity (T205 - US6)
 * Represents a user assigned to a card
 *
 * Join table between Card and User for many-to-many assignment relationship
 * Includes metadata about who performed the assignment and when
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { CardEntity } from './card.entity';
import { UserEntity } from './user.entity';

@Entity('card_assignments')
@Unique(['cardId', 'userId']) // Composite unique: can't assign same user twice
@Index(['cardId']) // Lookup card's assignees
@Index(['userId']) // Lookup user's assigned cards (for "assigned to me" view)
@Index(['assignedAt']) // Order by assignment date
export class CardAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  cardId!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  assignedBy!: string;

  @CreateDateColumn()
  assignedAt!: Date;

  // Relations
  @ManyToOne(() => CardEntity, (card) => card.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cardId' })
  card!: CardEntity;

  @ManyToOne(() => UserEntity, (user) => user.cardAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser!: UserEntity;
}
