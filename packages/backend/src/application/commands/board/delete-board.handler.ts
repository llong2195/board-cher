/**
 * Delete Board Command Handler
 * Task: T082 [US1]
 *
 * Handles permanent deletion of a board.
 * Only archived boards can be deleted per business rules.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DeleteBoardCommand } from './delete-board.command';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { BoardDeletedEvent } from '../../../domain/board/events/board.events';

@Injectable()
@CommandHandler(DeleteBoardCommand)
export class DeleteBoardHandler implements ICommandHandler<DeleteBoardCommand> {
  constructor(
    @Inject('IBoardRepository')
    private readonly boardRepository: IBoardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: DeleteBoardCommand): Promise<void> {
    // Find existing board
    const board = await this.boardRepository.findById(command.boardId);
    if (!board) {
      throw new NotFoundException(`Board with ID ${command.boardId} not found`);
    }

    // Business rule: Only archived boards can be deleted
    if (!board.canDelete()) {
      throw new BadRequestException(
        'Only archived boards can be permanently deleted',
      );
    }

    // Delete from database
    await this.boardRepository.delete(command.boardId);

    // Emit domain event
    const event = new BoardDeletedEvent(
      command.boardId,
      command.userId,
      board.organizationId,
    );
    this.eventEmitter.emit('board.deleted', event);
  }
}
