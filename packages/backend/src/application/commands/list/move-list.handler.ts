/**
 * Move List Command Handler
 * Task: T086 [US1]
 *
 * Handles repositioning a list within a board using BoardAggregate.
 * Position recalculation is handled by the aggregate.
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MoveListCommand } from './move-list.command';
import { List } from '../../../domain/list/list.model';
import { IListRepository } from '../../../domain/list/list.repository';
import { IBoardAggregateRepository } from '../../../domain/board/board-aggregate.repository';

@Injectable()
@CommandHandler(MoveListCommand)
export class MoveListHandler implements ICommandHandler<MoveListCommand> {
  constructor(
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
    @Inject('IBoardAggregateRepository')
    private readonly boardAggregateRepository: IBoardAggregateRepository,
  ) {}

  async execute(command: MoveListCommand): Promise<List> {
    // First, find the list to get the boardId
    const list = await this.listRepository.findById(command.listId);
    if (!list) {
      throw new NotFoundException(`List with ID ${command.listId} not found`);
    }

    // Load board aggregate with lists
    const boardAggregate = await this.boardAggregateRepository.findById(
      list.boardId,
    );
    if (!boardAggregate) {
      throw new NotFoundException(`Board with ID ${list.boardId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    // Move list using aggregate (enforces business rules and emits events)
    boardAggregate.moveList(
      command.listId,
      command.targetPosition,
      command.userId,
    );

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.boardAggregateRepository.save(boardAggregate);

    // Return the moved list
    const movedList = boardAggregate.getListById(command.listId);
    if (!movedList) {
      throw new Error('List not found after move operation');
    }

    return movedList;
  }
}
