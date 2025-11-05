/**
 * Toggle Checklist Item Command Handler (T142)
 * User Story 2: Enrich Cards with Details
 *
 * Handles toggling the completion status of a checklist item using CardAggregate.
 * Emits ChecklistItemToggledEvent and ChecklistCompletedEvent for real-time updates
 * (handled automatically by aggregate).
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 *
 * Note: Requires IChecklistRepository to lookup checklistId and cardId from itemId,
 * as the command only provides itemId.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ToggleChecklistItemCommand } from './toggle-item.command';
import { ChecklistItem } from '../../../domain/checklist/checklist.model';
import { IChecklistRepository } from '../../../domain/checklist/checklist.repository';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';

@Injectable()
@CommandHandler(ToggleChecklistItemCommand)
export class ToggleChecklistItemHandler
  implements ICommandHandler<ToggleChecklistItemCommand>
{
  constructor(
    @Inject('IChecklistRepository')
    private readonly checklistRepository: IChecklistRepository,
    @Inject('ICardAggregateRepository')
    private readonly cardAggregateRepository: ICardAggregateRepository,
  ) {}

  async execute(command: ToggleChecklistItemCommand): Promise<ChecklistItem> {
    // Find the checklist item to get checklistId and cardId
    const item = await this.checklistRepository.findItemById(command.itemId);
    if (!item) {
      throw new NotFoundException(
        `Checklist item with ID ${command.itemId} not found`,
      );
    }

    // Find the parent checklist to get cardId and checklistId
    const checklists = await this.checklistRepository.findByCardId('*'); // TODO: Optimize this
    let parentChecklist = null;
    for (const checklist of checklists) {
      const checklistItem = checklist.getItem(command.itemId);
      if (checklistItem) {
        parentChecklist = checklist;
        break;
      }
    }

    if (!parentChecklist) {
      throw new NotFoundException('Parent checklist not found');
    }

    const cardId = parentChecklist.cardId;
    const checklistId = parentChecklist.id;

    // Load card aggregate
    const cardAggregate = await this.cardAggregateRepository.findById(cardId);
    if (!cardAggregate) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Toggle item using aggregate (enforces business rules and emits events)
    cardAggregate.toggleChecklistItem(checklistId, command.itemId);

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.cardAggregateRepository.save(cardAggregate);

    // Get the updated checklist to find the toggled item
    const allChecklists = cardAggregate.getChecklists();
    const updatedChecklist = allChecklists.find((c) => c.id === checklistId);
    if (!updatedChecklist) {
      throw new NotFoundException(`Checklist with ID ${checklistId} not found`);
    }

    const updatedItem = updatedChecklist.getItem(command.itemId);
    if (!updatedItem) {
      throw new NotFoundException(
        `Checklist item with ID ${command.itemId} not found`,
      );
    }

    return updatedItem;
  }
}
