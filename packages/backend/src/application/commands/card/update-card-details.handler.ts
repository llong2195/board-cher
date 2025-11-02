/**
 * Update Card Details Command Handler (T143)
 * User Story 2: Enrich Cards with Details
 *
 * Handles updating card details (title, description, dueDate).
 * Emits CardUpdatedEvent and CardDueDateChangedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCardDetailsCommand } from './update-card-details.command';
import { Card } from '../../../domain/card/card.model';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import {
  CardUpdatedEvent,
  CardDueDateChangedEvent,
} from '../../../domain/card/events/card.events';

@Injectable()
@CommandHandler(UpdateCardDetailsCommand)
export class UpdateCardDetailsHandler
  implements ICommandHandler<UpdateCardDetailsCommand>
{
  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: UpdateCardDetailsCommand): Promise<Card> {
    // Verify card exists
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Track changes for events
    const changes: Partial<Card> = {};
    const oldDueDate = card.dueDate;

    // Update card details
    if (command.title !== undefined) {
      changes.title = command.title;
    }
    if (command.description !== undefined) {
      changes.description = command.description;
    }
    if (command.dueDate !== undefined) {
      changes.dueDate = command.dueDate;
    }

    card.update(command.title, command.description, command.dueDate);

    // Persist to database
    const savedCard = await this.cardRepository.save(card);

    // Emit CardUpdatedEvent
    const updateEvent = new CardUpdatedEvent(
      savedCard,
      command.userId,
      changes,
    );
    this.eventEmitter.emit('card.updated', updateEvent);

    // Emit CardDueDateChangedEvent if dueDate was changed
    if (command.dueDate !== undefined && oldDueDate !== card.dueDate) {
      const dueDateEvent = new CardDueDateChangedEvent(
        savedCard,
        command.userId,
        oldDueDate,
        card.dueDate,
      );
      this.eventEmitter.emit('card.dueDate.changed', dueDateEvent);
    }

    return savedCard;
  }
}
