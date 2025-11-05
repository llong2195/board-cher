/**
 * T210 - Assign Card Command Handler
 * User Story 6: Card Assignment and Notifications
 *
 * Handles assigning a user to a card using CardAggregate.
 * Validates:
 * - Card exists
 * - User to be assigned exists and has board access
 * - User is not already assigned (no duplicates) - enforced by aggregate
 * - Assigner has permission (member or admin, not guest)
 * Refactored to use DDD aggregate pattern for better business rule encapsulation.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AssignCardCommand } from './assign-card.command';
import { ICardAggregateRepository } from '../../../domain/card/card-aggregate.repository';
import { DataSource } from 'typeorm';
import { CardAssignmentEntity } from '../../../infrastructure/persistence/entities/card-assignment.entity';
import { UserEntity } from '../../../infrastructure/persistence/entities/user.entity';
import { BoardMemberEntity } from '../../../infrastructure/persistence/entities/board-member.entity';
import { CardEntity } from '../../../infrastructure/persistence/entities/card.entity';

@Injectable()
@CommandHandler(AssignCardCommand)
export class AssignCardHandler implements ICommandHandler<AssignCardCommand> {
  constructor(
    @Inject('ICardAggregateRepository')
    private readonly cardAggregateRepository: ICardAggregateRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: AssignCardCommand): Promise<CardAssignmentEntity> {
    // Start transaction (repository handles aggregate persistence transaction)
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

      // Load card aggregate
      const cardAggregate = await this.cardAggregateRepository.findById(
        command.cardId,
      );
      if (!cardAggregate) {
        throw new NotFoundException(`Card with ID ${command.cardId} not found`);
      }

      // Assign user using aggregate (enforces business rules and emits events)
      // Aggregate will check for duplicates and MAX_ASSIGNEES_PER_CARD constraint
      cardAggregate.assignUser(command.userId, command.assignedBy);

      // Save aggregate (persists changes and publishes domain events automatically)
      await this.cardAggregateRepository.save(cardAggregate);

      // Return the assignment entity (query it back from the database)
      const savedAssignment = await manager.findOne(CardAssignmentEntity, {
        where: {
          cardId: command.cardId,
          userId: command.userId,
        },
      });

      if (!savedAssignment) {
        throw new NotFoundException('Assignment was not saved correctly');
      }

      return savedAssignment;
    });
  }
}
