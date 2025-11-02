import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CardEntity } from './card.entity';
import { UserEntity } from './user.entity';

/**
 * Comment Entity (T123)
 *
 * Represents a comment on a card. Users can add text comments to cards
 * to provide updates, ask questions, or discuss the work.
 *
 * Relations:
 * - Many comments belong to one card
 * - Many comments belong to one user (author)
 *
 * Indexes:
 * - cardId for efficient card comment lookups
 * - userId for user activity tracking
 */
@Entity('comments')
@Index(['cardId'])
@Index(['userId'])
export class CommentEntity extends BaseEntity {
  /**
   * The card this comment belongs to
   */
  @Column('uuid')
  cardId: string;

  @ManyToOne(() => CardEntity, (card) => card.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cardId' })
  card: CardEntity;

  /**
   * The user who wrote this comment
   */
  @Column('uuid')
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * Comment text content (supports Markdown)
   * Max length: 10,000 characters
   */
  @Column('text')
  content: string;

  /**
   * Indicates if the comment has been edited after creation
   */
  @Column('boolean', { default: false })
  isEdited: boolean;
}
