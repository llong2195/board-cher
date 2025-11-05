/**
 * Add Comment Command Handler (T137)
 * User Story 2: Enrich Cards with Details
 *
 * Handles adding a text comment to a card using CardAggregate.
 * Emits CommentAddedEvent for real-time updates (handled by aggregate).
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentCommand } from './add-comment.command';
import { Comment } from '../../../domain/comment/comment.model';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';

@Injectable()
@CommandHandler(AddCommentCommand)
export class AddCommentHandler implements ICommandHandler<AddCommentCommand> {
  constructor(
    @Inject('ICardAggregateRepository')
    private readonly cardAggregateRepository: ICardAggregateRepository,
  ) {}

  async execute(command: AddCommentCommand): Promise<Comment> {
    // Load card aggregate
    const cardAggregate = await this.cardAggregateRepository.findById(
      command.cardId,
    );
    if (!cardAggregate) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Add comment using aggregate (enforces business rules and emits events)
    const commentId = uuidv4();
    const comment = cardAggregate.addComment(
      commentId,
      command.content,
      command.userId,
    );

    // Save aggregate (persists changes and publishes domain events automatically)
    await this.cardAggregateRepository.save(cardAggregate);

    return comment;
  }
}
