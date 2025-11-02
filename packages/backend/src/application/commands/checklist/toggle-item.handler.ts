/**
 * Toggle Checklist Item Command Handler (T142)
 * User Story 2: Enrich Cards with Details
 *
 * Handles toggling the completion status of a checklist item.
 * Emits ChecklistItemToggledEvent and ChecklistCompletedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ToggleChecklistItemCommand } from './toggle-item.command';
import { ChecklistItem } from '../../../domain/checklist/checklist.model';
import { IChecklistRepository } from '../../../domain/checklist/checklist.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import {
  ChecklistItemToggledEvent,
  ChecklistCompletedEvent,
} from '../../../domain/checklist/events/checklist.events';

@Injectable()
@CommandHandler(ToggleChecklistItemCommand)
export class ToggleChecklistItemHandler
  implements ICommandHandler<ToggleChecklistItemCommand>
{
  constructor(
    private readonly checklistRepository: IChecklistRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: ToggleChecklistItemCommand): Promise<ChecklistItem> {
    // Find the checklist item
    const item = await this.checklistRepository.findItemById(command.itemId);
    if (!item) {
      throw new NotFoundException(
        `Checklist item with ID ${command.itemId} not found`,
      );
    }

    // Find the parent checklist to get cardId
    // We need to query by scanning checklists (not optimal, but works for now)
    // In a real implementation, we'd store checklistId in the item or use a join
    const allChecklists = await this.checklistRepository.findByCardId('*'); // TODO: Optimize this
    let parentChecklist = null;
    for (const checklist of allChecklists) {
      const checklistItem = checklist.getItem(command.itemId);
      if (checklistItem) {
        parentChecklist = checklist;
        break;
      }
    }

    if (!parentChecklist) {
      throw new NotFoundException('Parent checklist not found');
    }

    // TODO: Add permission check - verify user has access to card

    // Toggle the item in the checklist domain model
    parentChecklist.toggleItem(command.itemId);

    // Get the updated item
    const updatedItem = parentChecklist.getItem(command.itemId)!;

    // Persist the checklist (which cascades to items)
    await this.checklistRepository.save(parentChecklist);

    // Emit toggle event
    const toggleEvent = new ChecklistItemToggledEvent(
      parentChecklist.id,
      parentChecklist.cardId,
      command.itemId,
      updatedItem.isCompleted,
      command.userId,
    );
    this.eventEmitter.emit('checklist.item.toggled', toggleEvent);

    // Check if checklist is now complete and emit completion event
    if (parentChecklist.isComplete()) {
      const completedEvent = new ChecklistCompletedEvent(
        parentChecklist,
        command.userId,
      );
      this.eventEmitter.emit('checklist.completed', completedEvent);
    }

    return updatedItem;
  }
}
