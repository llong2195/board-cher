/**
 * Add Comment Command Handler (T137)
 * User Story 2: Enrich Cards with Details
 *
 * Handles adding a text comment to a card.
 * Emits CommentAddedEvent for real-time updates.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentCommand } from './add-comment.command';
import { Comment } from '../../../domain/comment/comment.model';
import { ICommentRepository } from '../../../domain/comment/comment.repository';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { CommentAddedEvent } from '../../../domain/comment/events/comment.events';

@Injectable()
@CommandHandler(AddCommentCommand)
export class AddCommentHandler implements ICommandHandler<AddCommentCommand> {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly cardRepository: ICardRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: AddCommentCommand): Promise<Comment> {
    // Verify card exists
    const card = await this.cardRepository.findById(command.cardId);
    if (!card) {
      throw new NotFoundException(`Card with ID ${command.cardId} not found`);
    }

    // TODO: Add permission check - verify user has access to card

    // Create comment domain model
    const commentId = uuidv4();
    const comment = Comment.create(
      commentId,
      command.cardId,
      command.userId,
      command.content,
    );

    // Persist to database
    const savedComment = await this.commentRepository.save(comment);

    // Update card with comment reference
    card.addComment(savedComment.id);
    await this.cardRepository.save(card);

    // Emit domain event for real-time updates
    const event = new CommentAddedEvent(savedComment);
    this.eventEmitter.emit('comment.added', event);

    return savedComment;
  }
}
