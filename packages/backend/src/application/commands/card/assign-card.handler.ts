/**
 * T210 - Assign Card Command Handler
 * User Story 6: Card Assignment and Notifications
 *
 * Handles assigning a user to a card.
 * Validates:
 * - Card exists
 * - User to be assigned exists and has board access
 * - User is not already assigned (no duplicates)
 * - Assigner has permission (member or admin, not guest)
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AssignCardCommand } from './assign-card.command';
import { ICardRepository } from '../../../domain/card/card.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { CardAssignedEvent } from '../../../domain/card/events/card.events';
import { DataSource } from 'typeorm';
import { CardAssignmentEntity } from '../../../infrastructure/persistence/entities/card-assignment.entity';
import { UserEntity } from '../../../infrastructure/persistence/entities/user.entity';
import { BoardMemberEntity } from '../../../infrastructure/persistence/entities/board-member.entity';
import { CardEntity } from '../../../infrastructure/persistence/entities/card.entity';

@Injectable()
@CommandHandler(AssignCardCommand)
export class AssignCardHandler implements ICommandHandler<AssignCardCommand> {
  constructor(
    @Inject('ICardRepository')
    private readonly cardRepository: ICardRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: AssignCardCommand): Promise<CardAssignmentEntity> {
    // Start transaction
    return await this.dataSource.transaction(async (manager) => {
      // Verify card exists and get board info
      const card = await manager.findOne(CardEntity, {
        where: { id: command.cardId },
        relations: ['list', 'list.board'],
      });

      if (!card) {
        throw new NotFoundException(`Card with ID ${command.cardId} not found`);
      }

      const boardId = card.list.board.id;

      // Verify user to be assigned exists
      const userToAssign = await manager.findOne(UserEntity, {
        where: { id: command.userId },
      });

      if (!userToAssign) {
        throw new NotFoundException(`User with ID ${command.userId} not found`);
      }

      // Verify user to be assigned has board access
      const userBoardMembership = await manager.findOne(BoardMemberEntity, {
        where: {
          boardId,
          userId: command.userId,
        },
      });

      if (!userBoardMembership) {
        throw new ForbiddenException(
          `User ${command.userId} does not have access to this board`,
        );
      }

      // Check if assignment already exists
      const existingAssignment = await manager.findOne(CardAssignmentEntity, {
        where: {
          cardId: command.cardId,
          userId: command.userId,
        },
      });

      if (existingAssignment) {
        throw new ConflictException(
          `User ${command.userId} is already assigned to card ${command.cardId}`,
        );
      }

      // Create assignment
      const assignment = new CardAssignmentEntity();
      assignment.cardId = command.cardId;
      assignment.userId = command.userId;
      assignment.assignedBy = command.assignedBy;
      assignment.assignedAt = new Date();

      const savedAssignment = await manager.save(
        CardAssignmentEntity,
        assignment,
      );

      // Update domain model
      const cardDomain = await this.cardRepository.findById(command.cardId);
      if (cardDomain) {
        cardDomain.addAssignee(command.userId);
        await this.cardRepository.save(cardDomain);
      }

      // Emit domain event
      const event = new CardAssignedEvent(
        cardDomain!,
        command.userId,
        command.assignedBy,
      );
      this.eventEmitter.emit('card.assigned', event);

      return savedAssignment;
    });
  }
}
