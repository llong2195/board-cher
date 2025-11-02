/**
 * Move Card Command Handler
 * Task: T088 [US1]
 *
 * Handles moving a card within the same list or to a different list.
 * Supports cross-list moves with position recalculation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MoveCardCommand } from './move-card.command';
import { Card } from '../../../domain/card/card.model';
import { ICardRepository } from '../../../domain/card/card.repository';
import { IListRepository } from '../../../domain/list/list.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { CardMovedEvent } from '../../../domain/card/events/card.events';
import { PositionCalculatorService } from '../../../domain/shared/position-calculator.service';

@Injectable()
@CommandHandler(MoveCardCommand)
export class MoveCardHandler implements ICommandHandler<MoveCardCommand> {
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: MoveCardCommand): Promise<Card> {
    // Find the card
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // Verify target list exists
    const targetList = await this.listRepository.findById(command.targetListId);
    if (!targetList) {
      throw new NotFoundException(
        `List with ID ${command.targetListId} not found`,
      );
    }

    // TODO: Add permission check - verify user has access to board

    const oldListId = card.listId;
    const oldPosition = card.position;

    const isSameList = oldListId === command.targetListId;

    if (isSameList) {
      // Moving within the same list
      const cardsInList = await this.cardRepository.findByListId(card.listId);
      const updatedItems = PositionCalculatorService.calculateMovePositions(
        cardsInList.map((c) => ({ id: c.id, position: c.position })),
        command.cardId,
        command.targetPosition,
      );

      // Update positions for all affected cards
      for (const item of updatedItems) {
        const cardToUpdate = cardsInList.find((c) => c.id === item.id);
        if (cardToUpdate && cardToUpdate.position !== item.position) {
          cardToUpdate.moveTo(command.targetListId, item.position);
          await this.cardRepository.save(cardToUpdate);
        }
      }
    } else {
      // Moving to a different list
      const targetCards = await this.cardRepository.findByListId(
        command.targetListId,
      );
      const newPosition = PositionCalculatorService.calculateInsertPosition(
        targetCards.map((c) => c.position),
        command.targetPosition,
      );

      // Move the card
      card.moveTo(command.targetListId, newPosition);
      await this.cardRepository.save(card);
    }

    // Get the updated card
    const movedCard = await this.cardRepository.findById(command.cardId);
    if (!movedCard) {
      throw new Error('Card not found after move operation');
    }

    // Emit domain event
    const event = new CardMovedEvent(
      movedCard,
      command.userId,
      oldListId,
      oldPosition,
      command.targetListId,
      command.targetPosition,
    );
    this.eventEmitter.emit('card.moved', event);

    return movedCard;
  }
}
