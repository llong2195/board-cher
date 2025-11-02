/**
 * Create Checklist Command Handler (T141)
 * User Story 2: Enrich Cards with Details
 *
 * Handles creating a new checklist on a card.
 * Automatically calculates position if not provided.
 * Emits ChecklistCreatedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateChecklistCommand } from './create-checklist.command';
import { Checklist } from '../../../domain/checklist/checklist.model';
import { IChecklistRepository } from '../../../domain/checklist/checklist.repository';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { ChecklistCreatedEvent } from '../../../domain/checklist/events/checklist.events';

@Injectable()
@CommandHandler(CreateChecklistCommand)
export class CreateChecklistHandler
  implements ICommandHandler<CreateChecklistCommand>
{
  constructor(
    private readonly checklistRepository: IChecklistRepository,
    private readonly cardRepository: ICardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateChecklistCommand): Promise<Checklist> {
    // Verify card exists
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Calculate position if not provided
    let position = command.position ?? 0;
    if (command.position === undefined) {
      const existingChecklists = await this.checklistRepository.findByCardId(
        command.cardId,
      );
      position = existingChecklists.length;
    }

    // Create checklist domain model
    const checklistId = uuidv4();
    const checklist = Checklist.create(
      checklistId,
      command.cardId,
      command.name,
      position,
    );

    // Persist to database
    const savedChecklist = await this.checklistRepository.save(checklist);

    // Update card with checklist reference
    card.addChecklist(savedChecklist.id);
    await this.cardRepository.save(card);

    // Emit domain event for real-time updates
    const event = new ChecklistCreatedEvent(savedChecklist, command.userId);
    this.eventEmitter.emit('checklist.created', event);

    return savedChecklist;
  }
}
