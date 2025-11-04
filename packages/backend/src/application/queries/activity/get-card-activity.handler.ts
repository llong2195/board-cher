/**
 * T252 - Get Card Activity Query Handler
 * User Story 7: Activity History and Audit Trail
 *
 * Retrieves all activities for a specific card with pagination.
 * - Ordered by createdAt DESC (newest first)
 * - Includes user information
 * - Supports pagination
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetCardActivityQuery } from './get-card-activity.query';
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
@QueryHandler(GetCardActivityQuery)
export class GetCardActivityHandler
  implements IQueryHandler<GetCardActivityQuery>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    query: GetCardActivityQuery,
  ): Promise<PaginatedActivitiesResult> {
    const { cardId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Query activities for card with user info
    const queryBuilder = this.dataSource
      .createQueryBuilder(ActivityEntity, 'activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.cardId = :cardId', { cardId })
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
