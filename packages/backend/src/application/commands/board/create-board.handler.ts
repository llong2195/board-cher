/**
 * Create Board Command Handler
 * Task: T080 [US1]
 *
 * Handles the creation of a new board within an organization.
 * Validates user permissions and emits BoardCreated domain event.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateBoardCommand } from './create-board.command';
import { Board } from '../../../domain/board/board.model';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { BoardCreatedEvent } from '../../../domain/board/events/board.events';

@Injectable()
@CommandHandler(CreateBoardCommand)
export class CreateBoardHandler implements ICommandHandler<CreateBoardCommand> {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateBoardCommand): Promise<Board> {
    // Generate unique ID for the board
    const boardId = uuidv4();

    // Create board domain model
    const board = Board.create(
      boardId,
      command.organizationId,
      command.name,
      command.userId,
      command.description || null,
      command.color || null,
    );

    // Persist to database
    const savedBoard = await this.boardRepository.save(board);

    // Emit domain event
    const event = new BoardCreatedEvent(savedBoard, command.userId);
    this.eventEmitter.emit('board.created', event);

    return savedBoard;
  }
}
