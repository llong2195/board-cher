/**
 * Card Aggregate Repository Implementation
 *
 * Persists and retrieves Card aggregates with full hydration of all child entities
 * (comments, checklists, attachments, labels, assignments) with transaction support
 * and domain event publishing.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';
import { CardAggregate } from '../../../domain/card/card-aggregate';
import { Card } from '../../../domain/card/card.model';
import { Comment } from '../../../domain/comment/comment.model';
import {
  Checklist,
  ChecklistItem,
} from '../../../domain/checklist/checklist.model';
import { Attachment } from '../../../domain/attachment/attachment.model';
import { CardEntity } from '../entities/card.entity';
import { CommentEntity } from '../entities/comment.entity';
import { ChecklistEntity } from '../entities/checklist.entity';
import { ChecklistItemEntity } from '../entities/checklist-item.entity';
import { AttachmentEntity } from '../entities/attachment.entity';
import { CardAssignmentEntity } from '../entities/card-assignment.entity';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';

@Injectable()
export class CardAggregateRepositoryImpl implements ICardAggregateRepository {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(ChecklistEntity)
    private readonly checklistRepository: Repository<ChecklistEntity>,
    @InjectRepository(ChecklistItemEntity)
    private readonly checklistItemRepository: Repository<ChecklistItemEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    @InjectRepository(CardAssignmentEntity)
    private readonly assignmentRepository: Repository<CardAssignmentEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async findById(cardId: string): Promise<CardAggregate | null> {
    const cardEntity = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!cardEntity) {
      return null;
    }

    // Load all child entities
    const [
      commentEntities,
      checklistEntities,
      attachmentEntities,
      assignmentEntities,
    ] = await Promise.all([
      this.commentRepository.find({
        where: { cardId },
        order: { createdAt: 'ASC' },
      }),
      this.checklistRepository.find({
        where: { cardId },
        order: { position: 'ASC' },
      }),
      this.attachmentRepository.find({
        where: { cardId },
        order: { createdAt: 'DESC' },
      }),
      this.assignmentRepository.find({
        where: { cardId },
      }),
    ]);

    // Load checklist items for all checklists
    const checklistItems = new Map<string, ChecklistItem[]>();
    if (checklistEntities.length > 0) {
      const checklistIds = checklistEntities.map((c) => c.id);
      const itemEntities = await this.checklistItemRepository.find({
        where: { checklistId: In(checklistIds) },
        order: { position: 'ASC' },
      });

      // Group items by checklist
      itemEntities.forEach((itemEntity) => {
        const item = this.checklistItemEntityToDomain(itemEntity);
        const items = checklistItems.get(itemEntity.checklistId) || [];
        items.push(item);
        checklistItems.set(itemEntity.checklistId, items);
      });
    }

    // Map to domain models
    const card = this.cardEntityToDomain(cardEntity);
    const comments = commentEntities.map((e) => this.commentEntityToDomain(e));
    const checklists = checklistEntities.map((e) =>
      this.checklistEntityToDomain(e),
    );
    const attachments = attachmentEntities.map((e) =>
      this.attachmentEntityToDomain(e),
    );
    const labelIds: string[] = []; // Labels managed through card relations
    const assigneeIds = assignmentEntities.map((a) => a.userId);

    return CardAggregate.reconstitute(
      card,
      comments,
      checklists,
      checklistItems,
      attachments,
      labelIds,
      assigneeIds,
    );
  }

  async save(aggregate: CardAggregate): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = aggregate.getCard();
      const comments = aggregate.getComments();
      const checklists = aggregate.getChecklists();
      const attachments = aggregate.getAttachments();
      // Note: labelIds not used - labels managed through card relations
      const assigneeIds = aggregate.getAssigneeIds();

      // Save card (labels managed through relations, not stored directly)
      const cardEntity = this.cardDomainToEntity(card);
      await queryRunner.manager.save(CardEntity, cardEntity);

      // Handle comments
      const existingComments = await queryRunner.manager.find(CommentEntity, {
        where: { cardId: card.id },
      });
      const currentCommentIds = new Set(comments.map((c) => c.id));

      const commentsToDelete = existingComments.filter(
        (c) => !currentCommentIds.has(c.id),
      );
      if (commentsToDelete.length > 0) {
        await queryRunner.manager.remove(CommentEntity, commentsToDelete);
      }

      if (comments.length > 0) {
        const commentEntities = comments.map((c) =>
          this.commentDomainToEntity(c),
        );
        await queryRunner.manager.save(CommentEntity, commentEntities);
      }

      // Handle checklists and their items
      const existingChecklists = await queryRunner.manager.find(
        ChecklistEntity,
        {
          where: { cardId: card.id },
        },
      );
      const currentChecklistIds = new Set(checklists.map((c) => c.id));

      const checklistsToDelete = existingChecklists.filter(
        (c) => !currentChecklistIds.has(c.id),
      );
      if (checklistsToDelete.length > 0) {
        // Delete checklist items first
        const deleteChecklistIds = checklistsToDelete.map((c) => c.id);
        await queryRunner.manager.delete(ChecklistItemEntity, {
          checklistId: In(deleteChecklistIds),
        });
        await queryRunner.manager.remove(ChecklistEntity, checklistsToDelete);
      }

      if (checklists.length > 0) {
        const checklistEntities = checklists.map((c) =>
          this.checklistDomainToEntity(c),
        );
        await queryRunner.manager.save(ChecklistEntity, checklistEntities);

        // Save checklist items
        for (const checklist of checklists) {
          const items = aggregate.getChecklistItems(checklist.id);

          // Delete existing items for this checklist
          await queryRunner.manager.delete(ChecklistItemEntity, {
            checklistId: checklist.id,
          });

          // Save new items
          if (items.length > 0) {
            const itemEntities = items.map((item) =>
              this.checklistItemDomainToEntity(item, checklist.id),
            );
            await queryRunner.manager.save(ChecklistItemEntity, itemEntities);
          }
        }
      }

      // Handle attachments
      const existingAttachments = await queryRunner.manager.find(
        AttachmentEntity,
        {
          where: { cardId: card.id },
        },
      );
      const currentAttachmentIds = new Set(attachments.map((a) => a.id));

      const attachmentsToDelete = existingAttachments.filter(
        (a) => !currentAttachmentIds.has(a.id),
      );
      if (attachmentsToDelete.length > 0) {
        await queryRunner.manager.remove(AttachmentEntity, attachmentsToDelete);
      }

      if (attachments.length > 0) {
        const attachmentEntities = attachments.map((a) =>
          this.attachmentDomainToEntity(a),
        );
        await queryRunner.manager.save(AttachmentEntity, attachmentEntities);
      }

      // Handle assignments
      const existingAssignments = await queryRunner.manager.find(
        CardAssignmentEntity,
        {
          where: { cardId: card.id },
        },
      );
      const existingAssigneeIds = new Set(
        existingAssignments.map((a) => a.userId),
      );
      const currentAssigneeIds = new Set(assigneeIds);

      const assignmentsToDelete = existingAssignments.filter(
        (a) => !currentAssigneeIds.has(a.userId),
      );
      if (assignmentsToDelete.length > 0) {
        await queryRunner.manager.remove(
          CardAssignmentEntity,
          assignmentsToDelete,
        );
      }

      const newAssigneeIds = assigneeIds.filter(
        (id) => !existingAssigneeIds.has(id),
      );
      if (newAssigneeIds.length > 0) {
        const newAssignments = newAssigneeIds.map((userId) => {
          const assignment = new CardAssignmentEntity();
          assignment.cardId = card.id;
          assignment.userId = userId;
          assignment.assignedBy = card.createdBy; // Use card creator as default
          assignment.assignedAt = new Date();
          return assignment;
        });
        await queryRunner.manager.save(CardAssignmentEntity, newAssignments);
      }

      await queryRunner.commitTransaction();

      // Publish domain events after successful commit
      this.publishDomainEvents(aggregate);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(cardId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find all checklists to delete their items
      const checklists = await queryRunner.manager.find(ChecklistEntity, {
        where: { cardId },
      });

      if (checklists.length > 0) {
        const checklistIds = checklists.map((c) => c.id);
        await queryRunner.manager.delete(ChecklistItemEntity, {
          checklistId: In(checklistIds),
        });
      }

      // Delete all child entities
      await queryRunner.manager.delete(CommentEntity, { cardId });
      await queryRunner.manager.delete(ChecklistEntity, { cardId });
      await queryRunner.manager.delete(AttachmentEntity, { cardId });
      await queryRunner.manager.delete(CardAssignmentEntity, { cardId });

      // Delete card
      await queryRunner.manager.delete(CardEntity, { id: cardId });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByListId(listId: string): Promise<CardAggregate[]> {
    const cardEntities = await this.cardRepository.find({
      where: { listId },
      order: { position: 'ASC' },
    });

    const aggregates: CardAggregate[] = [];

    for (const cardEntity of cardEntities) {
      const aggregate = await this.findById(cardEntity.id);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }

    return aggregates;
  }

  async findByAssignee(userId: string): Promise<CardAggregate[]> {
    const assignments = await this.assignmentRepository.find({
      where: { userId },
    });

    const cardIds = assignments.map((a) => a.cardId);
    const aggregates: CardAggregate[] = [];

    for (const cardId of cardIds) {
      const aggregate = await this.findById(cardId);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }

    return aggregates;
  }

  async exists(cardId: string): Promise<boolean> {
    const count = await this.cardRepository.count({
      where: { id: cardId },
    });
    return count > 0;
  }

  /**
   * Publish domain events from aggregate
   */
  private publishDomainEvents(aggregate: CardAggregate): void {
    const events = aggregate.getDomainEvents();

    events.forEach((event) => {
      this.eventEmitter.emit(event.eventName, {
        ...event,
        occurredAt: event.occurredOn,
      });
    });

    aggregate.clearDomainEvents();
  }

  /**
   * Mapper: CardEntity -> Card domain model
   */
  private cardEntityToDomain(entity: CardEntity): Card {
    return new Card(
      entity.id,
      entity.listId,
      entity.title,
      entity.description,
      entity.position,
      entity.dueDate,
      entity.isArchived,
      entity.createdAt,
      entity.updatedAt,
      entity.createdBy,
    );
  }

  /**
   * Mapper: Card domain model -> CardEntity
   */
  private cardDomainToEntity(card: Card): CardEntity {
    const entity = new CardEntity();
    entity.id = card.id;
    entity.listId = card.listId;
    entity.title = card.title;
    entity.description = card.description;
    entity.position = card.position;
    entity.dueDate = card.dueDate;
    entity.isArchived = card.isArchived;
    entity.createdAt = card.createdAt;
    entity.updatedAt = card.updatedAt;
    entity.createdBy = card.createdBy;
    return entity;
  }

  /**
   * Mapper: CommentEntity -> Comment domain model
   */
  private commentEntityToDomain(entity: CommentEntity): Comment {
    return new Comment(
      entity.id,
      entity.cardId,
      entity.userId,
      entity.content,
      entity.isEdited,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Mapper: Comment domain model -> CommentEntity
   */
  private commentDomainToEntity(comment: Comment): CommentEntity {
    const entity = new CommentEntity();
    entity.id = comment.id;
    entity.cardId = comment.cardId;
    entity.userId = comment.userId;
    entity.content = comment.content;
    entity.isEdited = comment.isEdited;
    entity.createdAt = comment.createdAt;
    entity.updatedAt = comment.updatedAt;
    return entity;
  }

  /**
   * Mapper: ChecklistEntity -> Checklist domain model
   */
  private checklistEntityToDomain(entity: ChecklistEntity): Checklist {
    return new Checklist(
      entity.id,
      entity.cardId,
      entity.name,
      entity.position,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Mapper: Checklist domain model -> ChecklistEntity
   */
  private checklistDomainToEntity(checklist: Checklist): ChecklistEntity {
    const entity = new ChecklistEntity();
    entity.id = checklist.id;
    entity.cardId = checklist.cardId;
    entity.name = checklist.name;
    entity.position = checklist.position;
    entity.createdAt = checklist.createdAt;
    entity.updatedAt = checklist.updatedAt;
    return entity;
  }

  /**
   * Mapper: ChecklistItemEntity -> ChecklistItem domain model
   */
  private checklistItemEntityToDomain(
    entity: ChecklistItemEntity,
  ): ChecklistItem {
    return new ChecklistItem(
      entity.id,
      entity.text,
      entity.isCompleted,
      entity.position,
    );
  }

  /**
   * Mapper: ChecklistItem domain model -> ChecklistItemEntity
   */
  private checklistItemDomainToEntity(
    item: ChecklistItem,
    checklistId: string,
  ): ChecklistItemEntity {
    const entity = new ChecklistItemEntity();
    entity.id = item.id;
    entity.checklistId = checklistId;
    entity.text = item.text;
    entity.isCompleted = item.isCompleted;
    entity.position = item.position;
    return entity;
  }

  /**
   * Mapper: AttachmentEntity -> Attachment domain model
   */
  private attachmentEntityToDomain(entity: AttachmentEntity): Attachment {
    return new Attachment(
      entity.id,
      entity.cardId,
      entity.userId,
      entity.name,
      entity.filename,
      entity.mimeType,
      entity.size,
      entity.storagePath,
      entity.url,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Mapper: Attachment domain model -> AttachmentEntity
   */
  private attachmentDomainToEntity(attachment: Attachment): AttachmentEntity {
    const entity = new AttachmentEntity();
    entity.id = attachment.id;
    entity.cardId = attachment.cardId;
    entity.userId = attachment.userId;
    entity.name = attachment.name;
    entity.filename = attachment.filename;
    entity.mimeType = attachment.mimeType;
    entity.size = attachment.size;
    entity.storagePath = attachment.storagePath;
    entity.url = attachment.url;
    entity.createdAt = attachment.createdAt;
    entity.updatedAt = attachment.updatedAt;
    return entity;
  }
}
