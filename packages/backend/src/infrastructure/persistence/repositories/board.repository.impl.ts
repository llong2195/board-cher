/**
 * BoardRepository Implementation (TypeORM)
 * Task: T090 [US1]
 *
 * Concrete implementation of IBoardRepository using TypeORM.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { Board } from '../../../domain/board/board.model';
import { BoardEntity } from '../entities/board.entity';

@Injectable()
export class BoardRepositoryImpl implements IBoardRepository {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
  ) {}

  async findById(id: string): Promise<Board | null> {
    const entity = await this.boardRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    includeArchived = false,
  ): Promise<Board[]> {
    const where: { organizationId: string; isArchived?: boolean } = {
      organizationId,
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    const entities = await this.boardRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUserId(
    userId: string,
    includeArchived = false,
  ): Promise<Board[]> {
    const queryBuilder = this.boardRepository
      .createQueryBuilder('board')
      .leftJoin('board.members', 'member')
      .where('member.userId = :userId', { userId });

    if (!includeArchived) {
      queryBuilder.andWhere('board.isArchived = :isArchived', {
        isArchived: false,
      });
    }

    queryBuilder.orderBy('board.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(board: Board): Promise<Board> {
    const entity = this.toEntity(board);
    const saved = await this.boardRepository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.boardRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.boardRepository.count({ where: { id } });
    return count > 0;
  }

  async countByOrganizationId(organizationId: string): Promise<number> {
    return await this.boardRepository.count({
      where: { organizationId, isArchived: false },
    });
  }

  async findWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    includeArchived = false,
  ): Promise<{ boards: Board[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: { organizationId: string; isArchived?: boolean } = {
      organizationId,
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    const [entities, total] = await this.boardRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      boards: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  /**
   * Convert domain model to entity
   */
  private toEntity(board: Board): BoardEntity {
    const entity = new BoardEntity();
    entity.id = board.id;
    entity.organizationId = board.organizationId;
    entity.name = board.name;
    entity.description = board.description;
    entity.color = board.color;
    entity.isArchived = board.isArchived;
    entity.createdBy = board.createdBy;
    entity.createdAt = board.createdAt;
    entity.updatedAt = board.updatedAt;
    return entity;
  }

  /**
   * Convert entity to domain model
   */
  private toDomain(entity: BoardEntity): Board {
    return new Board(
      entity.id,
      entity.organizationId,
      entity.name,
      entity.description,
      entity.color,
      entity.isArchived,
      entity.createdAt,
      entity.updatedAt,
      entity.createdBy,
    );
  }
}
