/**
 * T212 - Get Assigned Cards Query Handler
 * User Story 6: Card Assignment and Notifications
 *
 * Retrieves all cards assigned to a specific user.
 * - Filters by boards user has access to
 * - Supports pagination
 * - Orders by due date (ascending), then by updated date
 * - Includes card details with list and board info
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetAssignedCardsQuery } from './get-assigned-cards.query';
import { DataSource } from 'typeorm';
import { CardEntity } from '../../../infrastructure/persistence/entities/card.entity';
import { CardAssignmentEntity } from '../../../infrastructure/persistence/entities/card-assignment.entity';

export interface PaginatedCardsResult {
  data: CardEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable()
@QueryHandler(GetAssignedCardsQuery)
export class GetAssignedCardsHandler
  implements IQueryHandler<GetAssignedCardsQuery>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetAssignedCardsQuery): Promise<PaginatedCardsResult> {
    const { userId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Query cards assigned to user with joins for list and board info
    const queryBuilder = this.dataSource
      .createQueryBuilder(CardEntity, 'card')
      .innerJoin(
        CardAssignmentEntity,
        'assignment',
        'assignment.cardId = card.id',
      )
      .innerJoin('card.list', 'list')
      .innerJoin('list.board', 'board')
      .innerJoin('board.members', 'boardMember', 'boardMember.userId = :userId')
      .leftJoinAndSelect('card.assignments', 'cardAssignments')
      .leftJoinAndSelect('cardAssignments.user', 'assignedUser')
      .where('assignment.userId = :userId', { userId })
      .andWhere('card.isArchived = :isArchived', { isArchived: false })
      .orderBy('card.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('card.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }
}
