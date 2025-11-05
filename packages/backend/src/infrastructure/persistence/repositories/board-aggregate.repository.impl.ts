/**
 * Board Aggregate Repository Implementation
 *
 * Persists and retrieves Board aggregates with transaction support
 * and domain event publishing.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IBoardAggregateRepository } from '../../../domain/board/board-aggregate.repository';
import { BoardAggregate } from '../../../domain/board/board-aggregate';
import { Board } from '../../../domain/board/board.model';
import { List } from '../../../domain/list/list.model';
import { BoardEntity } from '../entities/board.entity';
import { ListEntity } from '../entities/list.entity';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';

@Injectable()
export class BoardAggregateRepositoryImpl implements IBoardAggregateRepository {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(ListEntity)
    private readonly listRepository: Repository<ListEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async findById(boardId: string): Promise<BoardAggregate | null> {
    const boardEntity = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!boardEntity) {
      return null;
    }

    // Load all lists for the board
    const listEntities = await this.listRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    // Reconstitute the aggregate
    const board = this.boardEntityToDomain(boardEntity);
    const lists = listEntities.map((e) => this.listEntityToDomain(e));

    return BoardAggregate.reconstitute(board, lists);
  }

  async save(aggregate: BoardAggregate): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const board = aggregate.getBoard();
      const lists = aggregate.getLists();

      // Save board
      const boardEntity = this.boardDomainToEntity(board);
      await queryRunner.manager.save(BoardEntity, boardEntity);

      // Get existing lists to detect deletions
      const existingLists = await queryRunner.manager.find(ListEntity, {
        where: { boardId: board.id },
      });

      const currentListIds = new Set(lists.map((l) => l.id));

      // Delete lists that are no longer in the aggregate
      const listsToDelete = existingLists.filter(
        (l) => !currentListIds.has(l.id),
      );
      if (listsToDelete.length > 0) {
        await queryRunner.manager.remove(ListEntity, listsToDelete);
      }

      // Save current lists
      const listEntities = lists.map((l) => this.listDomainToEntity(l));
      await queryRunner.manager.save(ListEntity, listEntities);

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

  async delete(boardId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete all lists first (cascade will handle cards)
      await queryRunner.manager.delete(ListEntity, { boardId });

      // Delete board
      await queryRunner.manager.delete(BoardEntity, { id: boardId });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<BoardAggregate[]> {
    const boardEntities = await this.boardRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });

    const aggregates: BoardAggregate[] = [];

    for (const boardEntity of boardEntities) {
      const listEntities = await this.listRepository.find({
        where: { boardId: boardEntity.id },
        order: { position: 'ASC' },
      });

      const board = this.boardEntityToDomain(boardEntity);
      const lists = listEntities.map((e) => this.listEntityToDomain(e));

      aggregates.push(BoardAggregate.reconstitute(board, lists));
    }

    return aggregates;
  }

  async exists(boardId: string): Promise<boolean> {
    const count = await this.boardRepository.count({
      where: { id: boardId },
    });
    return count > 0;
  }

  /**
   * Publish domain events from aggregate
   */
  private publishDomainEvents(aggregate: BoardAggregate): void {
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
   * Mapper: BoardEntity -> Board domain model
   */
  private boardEntityToDomain(entity: BoardEntity): Board {
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

  /**
   * Mapper: Board domain model -> BoardEntity
   */
  private boardDomainToEntity(board: Board): BoardEntity {
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
   * Mapper: ListEntity -> List domain model
   */
  private listEntityToDomain(entity: ListEntity): List {
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

  /**
   * Mapper: List domain model -> ListEntity
   */
  private listDomainToEntity(list: List): ListEntity {
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
}
