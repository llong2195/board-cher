/**
 * BoardRepository Implementation (TypeORM + Redis Cache)
 * Task: T090 [US1], T265 [Phase 10]
 *
 * Concrete implementation of IBoardRepository using TypeORM with Redis caching.
 * Cache TTL: 5 minutes for board queries
 * Cache invalidation: On save/update/delete operations
 */

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { Board } from '../../../domain/board/board.model';
import { BoardEntity } from '../entities/board.entity';

@Injectable()
export class BoardRepositoryImpl implements IBoardRepository {
  private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds
  private readonly CACHE_PREFIX = 'board:';

  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findById(id: string): Promise<Board | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<Board>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, get from database
    const entity = await this.boardRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }

    const board = this.toDomain(entity);

    // Store in cache with TTL
    await this.cacheManager.set(cacheKey, board, this.CACHE_TTL);

    return board;
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
    const result = this.toDomain(saved);

    // Invalidate cache after save/update
    const cacheKey = `${this.CACHE_PREFIX}${result.id}`;
    await this.cacheManager.del(cacheKey);

    // Also invalidate organization-level caches if needed
    await this.invalidateOrganizationCache(result.organizationId);

    return result;
  }

  async delete(id: string): Promise<void> {
    // Get board before deletion to invalidate org cache
    const board = await this.findById(id);

    await this.boardRepository.delete(id);

    // Invalidate cache after deletion
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.cacheManager.del(cacheKey);

    if (board) {
      await this.invalidateOrganizationCache(board.organizationId);
    }
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
    includeArchived: boolean = false,
  ): Promise<{ boards: Board[]; total: number }> {
    const where: { organizationId: string; isArchived?: boolean } = {
      organizationId,
    };
    if (!includeArchived) {
      where.isArchived = false;
    }

    const [entities, total] = await this.boardRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      boards: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  /**
   * Invalidate organization-level cached queries
   * @param organizationId Organization ID to invalidate cache for
   */
  private async invalidateOrganizationCache(
    organizationId: string,
  ): Promise<void> {
    // In a more sophisticated implementation, this could:
    // 1. Track org-level cache keys in a Redis Set
    // 2. Invalidate all board list queries for this org
    // For now, we'll use a simple prefix-based approach
    const orgCacheKey = `${this.CACHE_PREFIX}org:${organizationId}`;
    await this.cacheManager.del(orgCacheKey);
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
