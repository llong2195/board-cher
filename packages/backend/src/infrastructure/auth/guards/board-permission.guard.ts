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

    // Direct board access via boardId param
    if (params.boardId) {
      return params.boardId;
    }

    // List ID from card creation route
    if (params.listId) {
      return this.getBoardIdFromList(params.listId);
    }

    // Resource ID - determine type from URL path
    if (params.id) {
      const path = request.route?.path || request.url;
      return this.getBoardIdFromResource(params.id, path);
    }

    // No board context found
    return null;
  }

  /**
   * Get board ID from list ID
   */
  private async getBoardIdFromList(listId: string): Promise<string | null> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      select: ['boardId'],
    });
    return list?.boardId || null;
  }

  /**
   * Get board ID from resource (board/list/card) based on path
   */
  private async getBoardIdFromResource(
    resourceId: string,
    path: string,
  ): Promise<string | null> {
    if (path.includes('/boards/:id')) {
      return resourceId;
    }

    if (path.includes('/lists/:id')) {
      return this.getBoardIdFromList(resourceId);
    }

    if (path.includes('/cards/:id')) {
      return this.getBoardIdFromCard(resourceId);
    }

    return null;
  }

  /**
   * Get board ID from card ID
   */
  private async getBoardIdFromCard(cardId: string): Promise<string | null> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'],
      select: ['id'],
    });
    return card?.list?.boardId || null;
  }
}
