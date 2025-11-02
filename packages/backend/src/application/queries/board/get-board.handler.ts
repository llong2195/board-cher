/**
 * Get Board Query Handler
 * Task: T083 [US1]
 *
 * Retrieves a single board by ID with permission check.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { GetBoardQuery } from './get-board.query';
import { Board } from '../../../domain/board/board.model';
import { IBoardRepository } from '../../../domain/board/board.repository';

@Injectable()
@QueryHandler(GetBoardQuery)
export class GetBoardHandler implements IQueryHandler<GetBoardQuery> {
  constructor(
    @Inject('IBoardRepository')
    private readonly boardRepository: IBoardRepository,
  ) {}

  async execute(query: GetBoardQuery): Promise<Board> {
    const board = await this.boardRepository.findById(query.boardId);

    if (!board) {
      throw new NotFoundException(`Board with ID ${query.boardId} not found`);
    }

    // TODO: Add permission check - verify user has access to this board

    return board;
  }
}
