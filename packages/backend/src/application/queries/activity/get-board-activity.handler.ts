/**
 * T253 - Get Board Activity Query Handler
 * User Story 7: Activity History and Audit Trail
 *
 * Retrieves all activities for a specific board with pagination.
 * - Includes board-level and card-level activities
 * - Ordered by createdAt DESC (newest first)
 * - Includes user information
 * - Supports pagination
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetBoardActivityQuery } from './get-board-activity.query';
import { DataSource } from 'typeorm';
import { ActivityEntity } from '../../../infrastructure/persistence/entities/activity.entity';

export interface PaginatedActivitiesResult {
  data: ActivityEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable()
@QueryHandler(GetBoardActivityQuery)
export class GetBoardActivityHandler
  implements IQueryHandler<GetBoardActivityQuery>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    query: GetBoardActivityQuery,
  ): Promise<PaginatedActivitiesResult> {
    const { boardId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Query activities for board with user info
    const queryBuilder = this.dataSource
      .createQueryBuilder(ActivityEntity, 'activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.boardId = :boardId', { boardId })
      .orderBy('activity.createdAt', 'DESC')
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
