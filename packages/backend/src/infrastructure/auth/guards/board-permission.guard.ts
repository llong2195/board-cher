import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMemberEntity } from '../../persistence/entities/board-member.entity';
import { BoardEntity } from '../../persistence/entities/board.entity';
import { ListEntity } from '../../persistence/entities/list.entity';
import { CardEntity } from '../../persistence/entities/card.entity';

/**
 * Board Permission Guard
 *
 * Verifies that the authenticated user has access to the board
 * associated with the requested resource (board, list, or card).
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, BoardPermissionGuard)
 */
@Injectable()
export class BoardPermissionGuard implements CanActivate {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardMemberEntity)
    private readonly boardMemberRepository: Repository<BoardMemberEntity>,
    @InjectRepository(ListEntity)
    private readonly listRepository: Repository<ListEntity>,
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const boardId = await this.extractBoardId(request);

    if (!boardId) {
      // If no board context, allow (e.g., listing all boards)
      return true;
    }

    // Check if board exists
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the board
    const membership = await this.boardMemberRepository.findOne({
      where: {
        boardId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this board');
    }

    // Attach board to request for downstream use
    request.board = board;
    request.boardMembership = membership;

    return true;
  }

  /**
   * Extract board ID from the request based on the resource being accessed
   */
  private async extractBoardId(request: any): Promise<string | null> {
    const params = request.params;

    // Direct board access
    if (params.boardId) {
      return params.boardId;
    }

    if (params.id) {
      // Determine resource type from the URL path
      const path = request.route?.path || request.url;

      // Board resource
      if (path.includes('/boards/:id')) {
        return params.id;
      }

      // List resource - get boardId from list
      if (path.includes('/lists/:id')) {
        const list = await this.listRepository.findOne({
          where: { id: params.id },
          select: ['boardId'],
        });
        return list?.boardId || null;
      }

      // Card resource - get boardId via list
      if (path.includes('/cards/:id')) {
        const card = await this.cardRepository.findOne({
          where: { id: params.id },
          relations: ['list'],
          select: ['id'],
        });
        return card?.list?.boardId || null;
      }
    }

    // List ID from card creation route
    if (params.listId) {
      const list = await this.listRepository.findOne({
        where: { id: params.listId },
        select: ['boardId'],
      });
      return list?.boardId || null;
    }

    // No board context found
    return null;
  }
}
