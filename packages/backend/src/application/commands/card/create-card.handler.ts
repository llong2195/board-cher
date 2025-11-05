/**
 * Create Card Command Handler
 * Task: T087 [US1]
 *
 * Handles the creation of a new card within a list.
 * Automatically calculates position if not provided.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateCardCommand } from './create-card.command';
import { Card } from '../../../domain/card/card.model';
import { ICardRepository } from '../../../domain/card/card.repository';
import { IListRepository } from '../../../domain/list/list.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { CardCreatedEvent } from '../../../domain/card/events/card.events';
import { PositionCalculatorService } from '../../../domain/shared/position-calculator.service';

@Injectable()
@CommandHandler(CreateCardCommand)
export class CreateCardHandler implements ICommandHandler<CreateCardCommand> {
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly positionCalculator: PositionCalculatorService,
  ) {}

  async execute(command: CreateCardCommand): Promise<Card> {
    // Verify list exists
    const list = await this.listRepository.findById(command.listId);
    if (!list) {
      throw new NotFoundException(`List with ID ${command.listId} not found`);
    }

    // TODO: Add permission check - verify user has access to board

    // Calculate position if not provided
    let position = command.position;
    if (position === undefined) {
      const existingCards = await this.cardRepository.findByListId(
        command.listId,
      );
      const maxPosition =
        existingCards.length > 0
          ? Math.max(...existingCards.map((c) => c.position))
          : 0;
      position = maxPosition + 1;
    }

    // Create card domain model
    const cardId = uuidv4();
    const card = Card.create(
      cardId,
      command.listId,
      command.title,
      position,
      command.userId,
      command.description || null,
      null, // dueDate
    );

    // Persist to database
    const savedCard = await this.cardRepository.save(card);

    // Emit domain event
    const event = new CardCreatedEvent(savedCard, command.userId);
    this.eventEmitter.emit('card.created', event);

    return savedCard;
  }
}
