/**
 * Create Checklist Command Handler (T141)
 * User Story 2: Enrich Cards with Details
 *
 * Handles creating a new checklist on a card using CardAggregate.
 * Position is calculated automatically if not provided.
 * Emits ChecklistCreatedEvent for real-time updates (handled by aggregate).
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateChecklistCommand } from './create-checklist.command';
import { Checklist } from '../../../domain/checklist/checklist.model';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';

@Injectable()
@CommandHandler(CreateChecklistCommand)
export class CreateChecklistHandler
  implements ICommandHandler<CreateChecklistCommand>
{
  constructor(
    @Inject('ICardAggregateRepository')
    private readonly cardAggregateRepository: ICardAggregateRepository,
  ) {}

  async execute(command: CreateChecklistCommand): Promise<Checklist> {
    // Load card aggregate
    const cardAggregate = await this.cardAggregateRepository.findById(
      command.cardId,
    );
    if (!cardAggregate) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Add checklist using aggregate (enforces business rules and emits events)
    const checklistId = uuidv4();
    const checklist = cardAggregate.addChecklist(checklistId, command.name);

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.cardAggregateRepository.save(cardAggregate);

    return checklist;
  }
}
