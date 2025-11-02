/**
 * List Boards Query Handler
 * Task: T084 [US1]
 *
 * Retrieves paginated list of boards for an organization.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ListBoardsQuery } from './list-boards.query';
import { Board } from '../../../domain/board/board.model';
import { IBoardRepository } from '../../../domain/board/board.repository';

export interface ListBoardsResult {
  boards: Board[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
@QueryHandler(ListBoardsQuery)
export class ListBoardsHandler implements IQueryHandler<ListBoardsQuery> {
  constructor(private readonly boardRepository: IBoardRepository) {}

  async execute(query: ListBoardsQuery): Promise<ListBoardsResult> {
    // TODO: Add permission check - verify user has access to organization

    const { boards, total } = await this.boardRepository.findWithPagination(
      query.organizationId,
      query.page,
      query.limit,
      query.includeArchived,
    );

    return {
      boards,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}
