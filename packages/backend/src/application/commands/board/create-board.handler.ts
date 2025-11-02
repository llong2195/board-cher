/**
 * Create Board Command Handler
 * Task: T080 [US1], T186 [US4]
 *
 * Handles the creation of a new board within an organization.
 * Validates user permissions and emits BoardCreated domain event.
 *
 * T186: Added organization membership and permission verification.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateBoardCommand } from './create-board.command';
import { Board } from '../../../domain/board/board.model';
import { IBoardRepository } from '../../../domain/board/board.repository';
import { DomainEventEmitter } from '../../../domain/shared/domain-event.emitter';
import { BoardCreatedEvent } from '../../../domain/board/events/board.events';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';

@Injectable()
@CommandHandler(CreateBoardCommand)
export class CreateBoardHandler implements ICommandHandler<CreateBoardCommand> {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async execute(command: CreateBoardCommand): Promise<Board> {
    // T186: Verify organization exists
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }

    // T186: Verify user has permission to create boards
    const member = await this.organizationRepository.findMember(
      command.organizationId,
      command.userId,
    );
    if (!member) {
      throw new ForbiddenException(
        'You must be a member of this organization to create boards',
      );
    }
    if (!member.canEditBoards()) {
      throw new ForbiddenException(
        'Only owners, admins, and members can create boards. Guests have read-only access.',
      );
    }

    // Generate unique ID for the board
    const boardId = uuidv4();

    // Create board domain model
    const board = Board.create(
      boardId,
      command.organizationId,
      command.name,
      command.userId,
      command.description || null,
      command.color || null,
    );

    // Persist to database
    const savedBoard = await this.boardRepository.save(board);

    // Emit domain event
    const event = new BoardCreatedEvent(savedBoard, command.userId);
    this.eventEmitter.emit('board.created', event);

    return savedBoard;
  }
}
