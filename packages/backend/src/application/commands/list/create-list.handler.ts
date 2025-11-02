/**
 * Create List Command Handler
 * Task: T085 [US1]
 *
 * Handles the creation of a new list within a board.
 * Automatically calculates position if not provided.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateListCommand } from './create-list.command';
import { List } from '../../../domain/list/list.model';
import { IListRepository } from '../../../domain/list/list.repository';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { ListCreatedEvent } from '../../../domain/list/events/list.events';
import { PositionCalculatorService } from '../../../domain/shared/position-calculator.service';

@Injectable()
@CommandHandler(CreateListCommand)
export class CreateListHandler implements ICommandHandler<CreateListCommand> {
  constructor(
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
    @Inject('IBoardRepository')
    private readonly boardRepository: IBoardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateListCommand): Promise<List> {
    // Verify board exists
    const board = await this.boardRepository.findById(command.boardId);
    if (!board) {
      throw new NotFoundException(`Board with ID ${command.boardId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    // Calculate position if not provided
    let position = command.position;
    if (position === undefined) {
      const existingLists = await this.listRepository.findByBoardId(
        command.boardId,
      );
      position = PositionCalculatorService.getNextPosition(
        existingLists.map((l) => l.position),
      );
    }

    // Create list domain model
    const listId = uuidv4();
    const list = List.create(listId, command.boardId, command.name, position);

    // Persist to database
    const savedList = await this.listRepository.save(list);

    // Emit domain event
    const event = new ListCreatedEvent(savedList, command.userId);
    this.eventEmitter.emit('list.created', event);

    return savedList;
  }
}
