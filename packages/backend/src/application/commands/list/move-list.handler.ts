/**
 * Move List Command Handler
 * Task: T086 [US1]
 *
 * Handles repositioning a list within a board with position recalculation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MoveListCommand } from './move-list.command';
import { List } from '../../../domain/list/list.model';
import { IListRepository } from '../../../domain/list/list.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { ListMovedEvent } from '../../../domain/list/events/list.events';
import { PositionCalculatorService } from '../../../domain/shared/position-calculator.service';

@Injectable()
@CommandHandler(MoveListCommand)
export class MoveListHandler implements ICommandHandler<MoveListCommand> {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: MoveListCommand): Promise<List> {
    // Find the list
    const list = await this.listRepository.findById(command.listId);
    if (!list) {
      throw new NotFoundException(`List with ID ${command.listId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    const oldPosition = list.position;

    // Get all lists in the board
    const allLists = await this.listRepository.findByBoardId(list.boardId);

    // Calculate new positions
    const updatedItems = PositionCalculatorService.calculateMovePositions(
      allLists.map((l) => ({ id: l.id, position: l.position })),
      command.listId,
      command.targetPosition,
    );

    // Update positions for all affected lists
    for (const item of updatedItems) {
      const listToUpdate = allLists.find((l) => l.id === item.id);
      if (listToUpdate && listToUpdate.position !== item.position) {
        listToUpdate.moveTo(item.position);
        await this.listRepository.save(listToUpdate);
      }
    }

    // Get the updated list
    const movedList = await this.listRepository.findById(command.listId);
    if (!movedList) {
      throw new Error('List not found after move operation');
    }

    // Emit domain event
    const event = new ListMovedEvent(
      movedList,
      command.userId,
      oldPosition,
      command.targetPosition,
    );
    this.eventEmitter.emit('list.moved', event);

    return movedList;
  }
}
