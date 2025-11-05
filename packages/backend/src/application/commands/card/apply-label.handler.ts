/**
 * Apply Label to Card Command Handler (T140)
 * User Story 2: Enrich Cards with Details
 *
 * Handles applying a board-level label to a specific card using CardAggregate.
 * Verifies label belongs to the card's board.
 * Emits LabelAppliedEvent for real-time updates (handled by aggregate).
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApplyLabelToCardCommand } from './apply-label.command';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';
import { ILabelRepository } from '../../../domain/label/label.repository';
import { IListRepository } from '../../../domain/list/list.repository';

@Injectable()
@CommandHandler(ApplyLabelToCardCommand)
export class ApplyLabelToCardHandler
  implements ICommandHandler<ApplyLabelToCardCommand>
{
  constructor(
    @Inject('ICardAggregateRepository')
    private readonly cardAggregateRepository: ICardAggregateRepository,
    @Inject('ILabelRepository')
    private readonly labelRepository: ILabelRepository,
    @Inject('IListRepository')
    private readonly listRepository: IListRepository,
  ) {}

  async execute(command: ApplyLabelToCardCommand): Promise<void> {
    // Load card aggregate
    const cardAggregate = await this.cardAggregateRepository.findById(
      command.cardId,
    );
    if (!cardAggregate) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // Verify label exists
    const label = await this.labelRepository.findById(command.labelId);
    if (!label) {
      throw new NotFoundException(`Label with ID ${command.labelId} not found`);
    }

    // Verify label belongs to the same board as the card
    const list = await this.listRepository.findById(
      cardAggregate.getCard().listId,
    );
    if (!list) {
      throw new NotFoundException(
        `List with ID ${cardAggregate.getCard().listId} not found`,
      );
    }

    if (label.boardId !== list.boardId) {
      throw new BadRequestException(
        'Label must belong to the same board as the card',
      );
    }

    // TODO: Add permission check - verify user has access to card

    // Apply label using aggregate (enforces business rules and emits events)
    // Aggregate will check for duplicates and MAX_LABELS_PER_CARD constraint
    cardAggregate.applyLabel(command.labelId, command.userId);

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.cardAggregateRepository.save(cardAggregate);
  }
}
