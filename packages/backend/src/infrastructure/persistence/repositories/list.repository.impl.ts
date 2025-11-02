/**
 * ListRepository Implementation (TypeORM)
 * Task: T091 [US1]
 *
 * Concrete implementation of IListRepository using TypeORM.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IListRepository } from '../../../domain/list/list.repository';
import { List } from '../../../domain/list/list.model';
import { ListEntity } from '../entities/list.entity';

@Injectable()
export class ListRepositoryImpl implements IListRepository {
  constructor(
    @InjectRepository(ListEntity)
    private readonly listRepository: Repository<ListEntity>,
  ) {}

  async findById(id: string): Promise<List | null> {
    const entity = await this.listRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBoardId(
    boardId: string,
    includeArchived = false,
  ): Promise<List[]> {
    const where: { boardId: string; isArchived?: boolean } = { boardId };

    if (!includeArchived) {
      where.isArchived = false;
    }

    const entities = await this.listRepository.find({
      where,
      order: { position: 'ASC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByBoardIdOrdered(
    boardId: string,
    includeArchived = false,
  ): Promise<List[]> {
    // This is the same as findByBoardId since we always order by position
    return this.findByBoardId(boardId, includeArchived);
  }

  async save(list: List): Promise<List> {
    const entity = this.toEntity(list);
    const saved = await this.listRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.listRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.listRepository.count({ where: { id } });
    return count > 0;
  }

  async countByBoardId(boardId: string): Promise<number> {
    return await this.listRepository.count({
      where: { boardId, isArchived: false },
    });
  }

  async findByPosition(
    boardId: string,
    position: number,
  ): Promise<List | null> {
    const entity = await this.listRepository.findOne({
      where: { boardId, position },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async getMaxPosition(boardId: string): Promise<number> {
    const result: { maxPosition: number | null } | undefined =
      await this.listRepository
        .createQueryBuilder('list')
        .select('MAX(list.position)', 'maxPosition')
        .where('list.boardId = :boardId', { boardId })
        .getRawOne();

    return result?.maxPosition ?? -1;
  }

  async getNextPosition(boardId: string): Promise<number> {
    const maxPosition = await this.getMaxPosition(boardId);
    return maxPosition + 1;
  }

  async updatePositions(
    lists: { id: string; position: number }[],
  ): Promise<void> {
    // Use transaction to update multiple positions atomically
    await this.listRepository.manager.transaction(async (manager) => {
      for (const { id, position } of lists) {
        await manager.update(ListEntity, { id }, { position });
      }
    });
  }

  /**
   * Convert domain model to entity
   */
  private toEntity(list: List): ListEntity {
    const entity = new ListEntity();
    entity.id = list.id;
    entity.boardId = list.boardId;
    entity.name = list.name;
    entity.position = list.position;
    entity.isArchived = list.isArchived;
    entity.createdAt = list.createdAt;
    entity.updatedAt = list.updatedAt;
    return entity;
  }

  /**
   * Convert entity to domain model
   */
  private toDomain(entity: ListEntity): List {
    return new List(
      entity.id,
      entity.boardId,
      entity.name,
      entity.position,
      entity.isArchived,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
