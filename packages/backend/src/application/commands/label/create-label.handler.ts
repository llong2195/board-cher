/**
 * Create Label Command Handler (T139)
 * User Story 2: Enrich Cards with Details
 *
 * Handles creating a new label for a board.
 * Labels are board-level entities with predefined colors.
 * Emits LabelCreatedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateLabelCommand } from './create-label.command';
import { Label } from '../../../domain/label/label.model';
import { ILabelRepository } from '../../../domain/label/label.repository';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { LabelCreatedEvent } from '../../../domain/label/events/label.events';

@Injectable()
@CommandHandler(CreateLabelCommand)
export class CreateLabelHandler implements ICommandHandler<CreateLabelCommand> {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly boardRepository: IBoardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateLabelCommand): Promise<Label> {
    // Verify board exists
    const board = await this.boardRepository.findById(command.boardId);
    if (!board) {
      throw new NotFoundException(`Board with ID ${command.boardId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    // Check for duplicate label name on the same board
    if (command.name) {
      const existingLabel = await this.labelRepository.findByBoardIdAndName(
        command.boardId,
        command.name,
      );
      if (existingLabel) {
        throw new ConflictException(
          `Label with name '${command.name}' already exists on this board`,
        );
      }
    }

    // Create label domain model
    const labelId = uuidv4();
    const label = Label.create(
      labelId,
      command.boardId,
      command.color,
      command.name || null,
    );

    // Persist to database
    const savedLabel = await this.labelRepository.save(label);

    // Emit domain event for real-time updates
    const event = new LabelCreatedEvent(savedLabel, command.userId);
    this.eventEmitter.emit('label.created', event);

    return savedLabel;
  }
}
