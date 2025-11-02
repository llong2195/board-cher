/**
 * CardRepository Implementation (TypeORM)
 * Task: T092 [US1]
 *
 * Concrete implementation of ICardRepository using TypeORM.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ICardRepository } from '../../../domain/card/card.repository';
import { Card } from '../../../domain/card/card.model';
import { CardEntity } from '../entities/card.entity';

@Injectable()
export class CardRepositoryImpl implements ICardRepository {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
  ) {}

  async findById(id: string): Promise<Card | null> {
    const entity = await this.cardRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByListId(listId: string, includeArchived = false): Promise<Card[]> {
    const where: { listId: string; isArchived?: boolean } = { listId };

    if (!includeArchived) {
      where.isArchived = false;
    }

    const entities = await this.cardRepository.find({
      where,
      order: { position: 'ASC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByListIdOrdered(
    listId: string,
    includeArchived = false,
  ): Promise<Card[]> {
    // This is the same as findByListId since we always order by position
    return this.findByListId(listId, includeArchived);
  }

  findByAssignedUserId(_userId: string): Promise<Card[]> {
    // TODO: Implement in Phase 7 when card assignment feature is added
    return Promise.resolve([]);
  }

  async findByBoardId(
    boardId: string,
    includeArchived = false,
  ): Promise<Card[]> {
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.list', 'list')
      .where('list.boardId = :boardId', { boardId });

    if (!includeArchived) {
      queryBuilder.andWhere('card.isArchived = :isArchived', {
        isArchived: false,
      });
    }

    queryBuilder.orderBy('card.position', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(card: Card): Promise<Card> {
    const entity = this.toEntity(card);
    const saved = await this.cardRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.cardRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.cardRepository.count({ where: { id } });
    return count > 0;
  }

  async countByListId(listId: string): Promise<number> {
    return await this.cardRepository.count({
      where: { listId, isArchived: false },
    });
  }

  async findByPosition(listId: string, position: number): Promise<Card | null> {
    const entity = await this.cardRepository.findOne({
      where: { listId, position },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async getMaxPosition(listId: string): Promise<number> {
    const result: { maxPosition: number | null } | undefined =
      await this.cardRepository
        .createQueryBuilder('card')
        .select('MAX(card.position)', 'maxPosition')
        .where('card.listId = :listId', { listId })
        .getRawOne();

    return result?.maxPosition ?? -1;
  }

  async search(
    boardId: string,
    searchTerm: string,
    limit?: number,
  ): Promise<Card[]> {
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.list', 'list')
      .where('list.boardId = :boardId', { boardId })
      .andWhere('card.isArchived = :isArchived', { isArchived: false })
      .andWhere(
        '(card.title ILIKE :searchTerm OR card.description ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      )
      .orderBy('card.updatedAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByDueDateRange(startDate: Date, endDate: Date): Promise<Card[]> {
    const entities = await this.cardRepository.find({
      where: {
        isArchived: false,
        dueDate: Between(startDate, endDate),
      },
      order: { dueDate: 'ASC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findOverdue(boardId: string): Promise<Card[]> {
    const now = new Date();
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.list', 'list')
      .where('list.boardId = :boardId', { boardId })
      .andWhere('card.isArchived = :isArchived', { isArchived: false })
      .andWhere('card.dueDate < :now', { now })
      .orderBy('card.dueDate', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Convert domain model to entity
   */
  private toEntity(card: Card): CardEntity {
    const entity = new CardEntity();
    entity.id = card.id;
    entity.listId = card.listId;
    entity.title = card.title;
    entity.description = card.description;
    entity.position = card.position;
    entity.dueDate = card.dueDate;
    entity.isArchived = card.isArchived;
    entity.createdBy = card.createdBy;
    entity.createdAt = card.createdAt;
    entity.updatedAt = card.updatedAt;
    return entity;
  }

  async getNextPosition(listId: string): Promise<number> {
    const maxPosition = await this.getMaxPosition(listId);
    return maxPosition + 1;
  }

  async updatePositions(
    cards: Array<{ id: string; position: number }>,
  ): Promise<void> {
    await this.cardRepository.manager.transaction(
      async (transactionalEntityManager) => {
        for (const update of cards) {
          await transactionalEntityManager.update(
            CardEntity,
            { id: update.id },
            { position: update.position },
          );
        }
      },
    );
  }

  async move(
    cardId: string,
    targetListId: string,
    position: number,
  ): Promise<Card> {
    const card = await this.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    card.moveTo(targetListId, position);
    return await this.save(card);
  }

  /**
   * Convert entity to domain model
   */
  private toDomain(entity: CardEntity): Card {
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
}
