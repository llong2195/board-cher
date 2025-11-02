/**
 * Update Board Command Handler
 * Task: T081 [US1]
 *
 * Handles updating an existing board's details.
 * Validates user permissions and emits BoardUpdated domain event.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateBoardCommand } from './update-board.command';
import { Board } from '../../../domain/board/board.model';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { BoardUpdatedEvent } from '../../../domain/board/events/board.events';

@Injectable()
@CommandHandler(UpdateBoardCommand)
export class UpdateBoardHandler implements ICommandHandler<UpdateBoardCommand> {
  constructor(
    @Inject('IBoardRepository')
    private readonly boardRepository: IBoardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: UpdateBoardCommand): Promise<Board> {
    // Find existing board
    const board = await this.boardRepository.findById(command.boardId);
    if (!board) {
      throw new NotFoundException(`Board with ID ${command.boardId} not found`);
    }

    // Track changes for event
    const changes: Partial<Board> = {};
    if (command.name !== undefined) changes.name = command.name;
    if (command.description !== undefined)
      changes.description = command.description;
    if (command.color !== undefined) changes.color = command.color;

    // Update board
    board.update(command.name, command.description, command.color);

    // Persist to database
    const updatedBoard = await this.boardRepository.save(board);

    // Emit domain event
    const event = new BoardUpdatedEvent(updatedBoard, command.userId, changes);
    this.eventEmitter.emit('board.updated', event);

    return updatedBoard;
  }
}
