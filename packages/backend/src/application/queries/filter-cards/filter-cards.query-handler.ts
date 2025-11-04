import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { FilterCardsQuery } from './filter-cards.query';
import { CardEntity } from '../../../infrastructure/persistence/entities/card.entity';
import { BoardEntity } from '../../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../../infrastructure/persistence/entities/board-member.entity';

export interface FilterCardsResult {
  data: CardEntity[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class FilterCardsQueryHandler {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardMemberEntity)
    private readonly boardMemberRepository: Repository<BoardMemberEntity>,
  ) {}

  async execute(query: FilterCardsQuery): Promise<FilterCardsResult> {
    const {
      boardId,
      userId,
      labelIds,
      assigneeIds,
      dueDateFilter,
      dueDateStart,
      dueDateEnd,
      limit,
      offset,
    } = query;

    // Verify board exists
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['organization'],
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    // Verify user has access to the board
    const boardMember = await this.boardMemberRepository.findOne({
      where: {
        userId,
        boardId,
      },
    });

    if (!boardMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    // Build filter query
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.list', 'list')
      .leftJoinAndSelect('card.labels', 'labels')
      .leftJoinAndSelect('card.assignments', 'assignments')
      .leftJoinAndSelect('assignments.user', 'assignee')
      .where('list.boardId = :boardId', { boardId })
      .andWhere('card.archivedAt IS NULL');

    // Filter by labels (OR logic - card has ANY of the specified labels)
    if (labelIds && labelIds.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('labels.id IN (:...labelIds)', { labelIds });
        }),
      );
    }

    // Filter by assignees (OR logic - card is assigned to ANY of the specified users)
    if (assigneeIds && assigneeIds.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('assignee.id IN (:...assigneeIds)', { assigneeIds });
        }),
      );
    }

    // Filter by due date
    if (dueDateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      queryBuilder.andWhere('card.dueDate >= :today', { today });
      queryBuilder.andWhere('card.dueDate < :tomorrow', { tomorrow });
    } else if (dueDateFilter === 'overdue') {
      const now = new Date();
      queryBuilder.andWhere('card.dueDate < :now', { now });
      queryBuilder.andWhere('card.dueDate IS NOT NULL');
    } else if (dueDateFilter === 'none') {
      queryBuilder.andWhere('card.dueDate IS NULL');
    }

    // Filter by date range
    if (dueDateStart) {
      queryBuilder.andWhere('card.dueDate >= :dueDateStart', { dueDateStart });
    }
    if (dueDateEnd) {
      queryBuilder.andWhere('card.dueDate <= :dueDateEnd', { dueDateEnd });
    }

    // Get total count (distinct to avoid duplicate rows from joins)
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const cards = await queryBuilder
      .orderBy('card.position', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: cards,
      total,
      limit,
      offset,
    };
  }
}
