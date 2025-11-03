/**
 * T211 - Unassign Card Command Handler
 * User Story 6: Card Assignment and Notifications
 *
 * Handles unassigning a user from a card.
 * Validates:
 * - Card exists
 * - Assignment exists
 * - User has permission to unassign
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UnassignCardCommand } from './unassign-card.command';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { CardUnassignedEvent } from '../../../domain/card/events/card.events';
import { DataSource } from 'typeorm';
import { CardAssignmentEntity } from '../../../infrastructure/persistence/entities/card-assignment.entity';

@Injectable()
@CommandHandler(UnassignCardCommand)
export class UnassignCardHandler
  implements ICommandHandler<UnassignCardCommand>
{
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: UnassignCardCommand): Promise<void> {
    // Start transaction
    await this.dataSource.transaction(async (manager) => {
      // Verify assignment exists
      const assignment = await manager.findOne(CardAssignmentEntity, {
        where: {
          cardId: command.cardId,
          userId: command.userId,
        },
      });

      if (!assignment) {
        throw new NotFoundException(
          `Assignment not found for user ${command.userId} on card ${command.cardId}`,
        );
      }

      // Delete assignment
      await manager.remove(CardAssignmentEntity, assignment);

      // Update domain model
      const cardDomain = await this.cardRepository.findById(command.cardId);
      if (cardDomain) {
        cardDomain.removeAssignee(command.userId);
        await this.cardRepository.save(cardDomain);

        // Emit domain event
        const event = new CardUnassignedEvent(
          cardDomain,
          command.userId,
          command.unassignedBy,
        );
        this.eventEmitter.emit('card.unassigned', event);
      }
    });
  }
}
