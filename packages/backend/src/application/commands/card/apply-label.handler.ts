/**
 * Apply Label to Card Command Handler (T140)
 * User Story 2: Enrich Cards with Details
 *
 * Handles applying a board-level label to a specific card.
 * Verifies label belongs to the card's board.
 * Emits LabelAppliedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ApplyLabelToCardCommand } from './apply-label.command';
import { ICardRepository } from '../../../domain/card/card.repository';
import { ILabelRepository } from '../../../domain/label/label.repository';
import { IListRepository } from '../../../domain/list/list.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { LabelAppliedEvent } from '../../../domain/label/events/label.events';

@Injectable()
@CommandHandler(ApplyLabelToCardCommand)
export class ApplyLabelToCardHandler
  implements ICommandHandler<ApplyLabelToCardCommand>
{
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    @Inject('ILabelRepository')
    private readonly labelRepository: ILabelRepository,
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: ApplyLabelToCardCommand): Promise<void> {
    // Verify card exists
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // Verify label exists
    const label = await this.labelRepository.findById(command.labelId);
    if (!label) {
      throw new NotFoundException(`Label with ID ${command.labelId} not found`);
    }

    // Verify label belongs to the same board as the card
    const list = await this.listRepository.findById(card.listId);
    if (!list) {
      throw new NotFoundException(`List with ID ${card.listId} not found`);
    }

    if (label.boardId !== list.boardId) {
      throw new BadRequestException(
        'Label must belong to the same board as the card',
      );
    }

    // TODO: Add permission check - verify user has access to card

    // Check if label is already applied
    const isAlreadyApplied = await this.labelRepository.isAppliedToCard(
      command.labelId,
      command.cardId,
    );
    if (isAlreadyApplied) {
      throw new ConflictException('Label is already applied to this card');
    }

    // Apply label to card (creates many-to-many relationship)
    await this.labelRepository.applyToCard(command.labelId, command.cardId);

    // Update card domain model
    card.addLabel(command.labelId);
    await this.cardRepository.save(card);

    // Emit domain event for real-time updates
    const event = new LabelAppliedEvent(
      command.labelId,
      label.boardId,
      command.cardId,
      command.userId,
    );
    this.eventEmitter.emit('label.applied', event);
  }
}
