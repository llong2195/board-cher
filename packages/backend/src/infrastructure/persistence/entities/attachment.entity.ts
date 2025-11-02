import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CardEntity } from './card.entity';
import { UserEntity } from './user.entity';

/**
 * Attachment Entity (T124)
 *
 * Represents a file attached to a card. Users can upload files
 * (images, PDFs, documents) to provide additional context for cards.
 *
 * Relations:
 * - Many attachments belong to one card
 * - Many attachments uploaded by one user
 *
 * Storage:
 * - Files are stored locally with path reference
 * - Original filename preserved for download
 *
 * Constraints:
 * - Max file size: 10MB
 * - Allowed types: images, PDFs, documents
 */
@Entity('attachments')
@Index(['cardId'])
@Index(['userId'])
export class AttachmentEntity extends BaseEntity {
  /**
   * The card this attachment belongs to
   */
  @Column('uuid')
  cardId: string;

  @ManyToOne(() => CardEntity, (card) => card.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cardId' })
  card: CardEntity;

  /**
   * The user who uploaded this attachment
   */
  @Column('uuid')
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * Display name for the attachment (can be customized by user)
   */
  @Column('varchar', { length: 255 })
  name: string;

  /**
   * Original filename from upload
   */
  @Column('varchar', { length: 255 })
  filename: string;

  /**
   * File MIME type (e.g., image/png, application/pdf)
   */
  @Column('varchar', { length: 100 })
  mimeType: string;

  /**
   * File size in bytes
   */
  @Column('int')
  size: number;

  /**
   * Storage path on disk (relative to uploads directory)
   */
  @Column('varchar', { length: 500 })
  storagePath: string;

  /**
   * Public URL for accessing the file
   */
  @Column('varchar', { length: 500 })
  url: string;
}
