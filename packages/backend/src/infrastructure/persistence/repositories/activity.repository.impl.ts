/**
 * T255 - ActivityRepository Implementation (TypeORM)
 * User Story 7: Activity History and Audit Trail
 *
 * Concrete implementation of IActivityRepository using TypeORM.
 * Provides query methods for activity history with pagination.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IActivityRepository } from '../../../domain/activity/activity.repository';
import { Activity } from '../../../domain/activity/activity.model';
import { ActivityEntity } from '../entities/activity.entity';

@Injectable()
export class ActivityRepositoryImpl implements IActivityRepository {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) {}

  async create(activity: Activity): Promise<Activity> {
    const entity = this.toEntity(activity);
    const saved = await this.activityRepository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Activity | null> {
    const entity = await this.activityRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBoardId(
    boardId: string,
    limit = 20,
    offset = 0,
  ): Promise<Activity[]> {
    const entities = await this.activityRepository.find({
      where: { boardId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByCardId(
    cardId: string,
    limit = 20,
    offset = 0,
  ): Promise<Activity[]> {
    const entities = await this.activityRepository.find({
      where: { cardId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUserId(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<Activity[]> {
    const entities = await this.activityRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit = 20,
    offset = 0,
  ): Promise<Activity[]> {
    const entities = await this.activityRepository.find({
      where: { entityType: entityType as any, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async countByBoardId(boardId: string): Promise<number> {
    return await this.activityRepository.count({ where: { boardId } });
  }

  async countByCardId(cardId: string): Promise<number> {
    return await this.activityRepository.count({ where: { cardId } });
  }

  async findRecent(limit = 20): Promise<Activity[]> {
    const entities = await this.activityRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  // ===== MAPPER METHODS =====

  /**
   * Convert domain Activity model to TypeORM entity
   */
  private toEntity(activity: Activity): ActivityEntity {
    const entity = new ActivityEntity();
    entity.id = activity.id;
    entity.userId = activity.userId;
    entity.boardId = activity.boardId;
    entity.cardId = activity.cardId;
    entity.actionType = activity.actionType;
    entity.entityType = activity.entityType;
    entity.entityId = activity.entityId;
    entity.metadata = activity.metadata;
    entity.createdAt = activity.createdAt;
    return entity;
  }

  /**
   * Convert TypeORM entity to domain Activity model
   */
  private toDomain(entity: ActivityEntity): Activity {
    return new Activity(
      entity.id,
      entity.userId,
      entity.boardId,
      entity.cardId,
      entity.actionType,
      entity.entityType,
      entity.entityId,
      entity.metadata,
      entity.createdAt,
    );
  }
}
