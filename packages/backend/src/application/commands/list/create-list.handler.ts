/**
 * Create List Command Handler
 * Task: T085 [US1]
 *
 * Handles the creation of a new list within a board using BoardAggregate.
 * Automatically calculates position if not provided.
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateListCommand } from './create-list.command';
import { List } from '../../../domain/list/list.model';
import { IBoardAggregateRepository } from '../../../domain/board/board-aggregate.repository';

@Injectable()
@CommandHandler(CreateListCommand)
export class CreateListHandler implements ICommandHandler<CreateListCommand> {
  constructor(
    @Inject('IBoardAggregateRepository')
    private readonly boardAggregateRepository: IBoardAggregateRepository,
  ) {}

  async execute(command: CreateListCommand): Promise<List> {
    // Load board aggregate
    const boardAggregate = await this.boardAggregateRepository.findById(
      command.boardId,
    );
    if (!boardAggregate) {
      throw new NotFoundException(`Board with ID ${command.boardId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    // Create list using aggregate (enforces business rules and emits events)
    const list = boardAggregate.addList(
      command.name,
      command.userId,
      command.position,
    );

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.boardAggregateRepository.save(boardAggregate);

    return list;
  }
}
