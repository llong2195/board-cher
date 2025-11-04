import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { SearchCardsQuery } from './search-cards.query';
import { CardEntity } from '../../../infrastructure/persistence/entities/card.entity';
import { BoardEntity } from '../../../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../../../infrastructure/persistence/entities/board-member.entity';

export interface SearchCardsResult {
  data: CardEntity[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class SearchCardsQueryHandler {
  constructor(
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardMemberEntity)
    private readonly boardMemberRepository: Repository<BoardMemberEntity>,
  ) {}

  async execute(query: SearchCardsQuery): Promise<SearchCardsResult> {
    const { boardId, userId, searchTerm, limit, offset } = query;

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

    // Build search query
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.list', 'list')
      .leftJoinAndSelect('card.labels', 'labels')
      .leftJoinAndSelect('card.assignments', 'assignments')
      .leftJoinAndSelect('assignments.user', 'assignee')
      .where('list.boardId = :boardId', { boardId })
      .andWhere('card.archivedAt IS NULL');

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim().length > 0) {
      const trimmedTerm = searchTerm.trim();
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(card.title) LIKE LOWER(:searchTerm)', {
            searchTerm: `%${trimmedTerm}%`,
          }).orWhere('LOWER(card.description) LIKE LOWER(:searchTerm)', {
            searchTerm: `%${trimmedTerm}%`,
          });
        }),
      );
    }

    // Get total count
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
