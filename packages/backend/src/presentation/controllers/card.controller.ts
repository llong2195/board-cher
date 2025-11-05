import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateCardCommand } from '../../application/commands/card/create-card.command';
import { MoveCardCommand } from '../../application/commands/card/move-card.command';
import { UnassignCardCommand } from '../../application/commands/card/unassign-card.command';
import { Card } from '../../domain/card/card.model';
import { BoardPermissionGuard } from '../../infrastructure/auth/guards/board-permission.guard';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CardResponseDto } from '../dto/card/card-response.dto';
import { CreateCardDto } from '../dto/card/create-card.dto';
import { MoveCardDto } from '../dto/card/move-card.dto';
import { AssignCardCommand } from '../../application/commands/card/assign-card.command';
import { GetAssignedCardsQuery } from '../../application/queries/card/get-assigned-cards.query';
import { ListCardsQuery } from '../../application/queries/card/list-cards.query';
import { SearchCardsDto } from '../dto/card/search-cards.dto';
import { FilterCardsDto } from '../dto/card/filter-cards.dto';
import { SearchCardsQuery } from '../../application/queries/search-cards/search-cards.query';
import { FilterCardsQuery } from '../../application/queries/filter-cards/filter-cards.query';

/**
 * Controller for card operations
 * Implements User Story 1: Kanban Board CRUD
 * Implements User Story 5: Search and Filter Work Items (T235-T236)
 * T193: BoardPermissionGuard applied to all card endpoints
 */
@ApiTags('cards')
@Controller()
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
export class CardController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new card in a list
   */
  @Post('lists/:listId/cards')
  @ApiOperation({ summary: 'Create a new card in a list' })
  @ApiCreatedResponse({
    description: 'Card created successfully',
    type: CardResponseDto,
  })
  async createCard(
    @Param('listId') listId: string,
    @Body() dto: CreateCardDto,
  ): Promise<CardResponseDto> {
    const command = new CreateCardCommand(
      listId,
      'temp-user-id', // TODO: Extract from JWT token
      dto.title,
      dto.description,
    );

    const card = await this.commandBus.execute<CreateCardCommand, Card>(
      command,
    );
    return this.mapToResponse(card);
  }

  /**
   * Get all cards in a list with cursor-based pagination (T267)
   */
  @Get('lists/:listId/cards')
  @ApiOperation({
    summary: 'Get all cards in a list',
    description: 'Supports cursor-based pagination for large lists',
  })
  @ApiOkResponse({
    description: 'Cards retrieved successfully',
    type: [CardResponseDto],
  })
  async getListCards(
    @Param('listId') listId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 50,
  ): Promise<{
    cards: CardResponseDto[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query = new ListCardsQuery(listId, cursor, limit);
    const result = await this.queryBus.execute(query);
    return {
      cards: result.cards.map((card: Card) => this.mapToResponse(card)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  /**
   * Search cards in a board (T235 - User Story 5: Search Work Items)
   * Supports full-text search on title and description with pagination
   */
  @Get('boards/:boardId/cards/search')
  @ApiOperation({
    summary: 'Search cards in a board',
    description:
      'Full-text search on card title and description. Case-insensitive with pagination support.',
  })
  @ApiOkResponse({
    description: 'Search results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CardResponseDto' },
        },
        total: { type: 'number', example: 42 },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  async searchCards(
    @Param('boardId') boardId: string,
    @Query() dto: SearchCardsDto,
    @Req() req: any,
  ): Promise<{
    data: CardResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const userId = req.user?.id || 'temp-user-id';
    const query = new SearchCardsQuery(
      boardId,
      userId,
      dto.q || '',
      dto.limit || 50,
      dto.offset || 0,
    );

    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map((card: Card) => this.mapToResponse(card)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * Filter cards in a board (T236 - User Story 5: Filter Work Items)
   * Supports filtering by labels, assignees, and due dates with pagination
   */
  @Get('boards/:boardId/cards')
  @ApiOperation({
    summary: 'Filter cards in a board',
    description:
      'Filter cards by labels (OR), assignees (OR), and due dates (AND logic). Supports pagination.',
  })
  @ApiOkResponse({
    description: 'Filtered cards retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CardResponseDto' },
        },
        total: { type: 'number', example: 42 },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  async filterCards(
    @Param('boardId') boardId: string,
    @Query() dto: FilterCardsDto,
    @Req() req: any,
  ): Promise<{
    data: CardResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const userId = req.user?.id || 'temp-user-id';

    const query = new FilterCardsQuery(
      boardId,
      userId,
      dto.labelId,
      dto.assigneeId,
      dto.dueDateFilter,
      dto.dueDateStart ? new Date(dto.dueDateStart) : undefined,
      dto.dueDateEnd ? new Date(dto.dueDateEnd) : undefined,
      dto.limit || 50,
      dto.offset || 0,
    );

    const result = await this.queryBus.execute(query);

    return {
      data: result.data.map((card: Card) => this.mapToResponse(card)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * Get card by ID (T153 - Updated for US2: includes enriched data)
   */
  @Get('cards/:id')
  @ApiOperation({
    summary: 'Get card details by ID',
    description:
      'Returns card with enriched details: comments, attachments, labels, and checklists',
  })
  @ApiOkResponse({
    description: 'Card retrieved successfully',
    type: CardResponseDto,
  })
  getCard(@Param('id') _id: string): Promise<CardResponseDto> {
    // TODO: Implement query handler for getting card with eager loading
    // Should include: comments, attachments, labels, checklists with items
    throw new Error('Get card not yet implemented');
  }

  /**
   * Update card
   */
  @Put('cards/:id')
  @ApiOperation({ summary: 'Update card' })
  @ApiOkResponse({
    description: 'Card updated successfully',
    type: CardResponseDto,
  })
  updateCard(
    @Param('id') _id: string,
    @Body() _dto: CreateCardDto, // TODO: Use UpdateCardDto when available
  ): Promise<CardResponseDto> {
    // TODO: Implement update card command
    throw new Error('Update card not yet implemented');
  }

  /**
   * Move card to different list/position
   */
  @Post('cards/:id/move')
  @ApiOperation({ summary: 'Move card to different list or position' })
  @ApiOkResponse({
    description: 'Card moved successfully',
    type: CardResponseDto,
  })
  async moveCard(
    @Param('id') id: string,
    @Body() dto: MoveCardDto,
  ): Promise<CardResponseDto> {
    const command = new MoveCardCommand(
      id,
      'temp-user-id', // TODO: Extract from JWT token
      dto.targetListId,
      dto.position,
    );
    const card = await this.commandBus.execute<MoveCardCommand, Card>(command);
    return this.mapToResponse(card);
  }

  /**
   * Delete card
   */
  @Delete('cards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card' })
  @ApiNoContentResponse({ description: 'Card deleted successfully' })
  deleteCard(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete card command
    throw new Error('Delete card not yet implemented');
  }

  /**
   * T216 - US6: Assign user to card
   */
  @Post('cards/:id/assignments/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a user to a card' })
  @ApiCreatedResponse({
    description: 'User assigned successfully',
  })
  async assignCard(
    @Param('id') cardId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const assignedBy = 'temp-user-id'; // TODO: Extract from JWT token
    const command = new AssignCardCommand(cardId, userId, assignedBy);
    await this.commandBus.execute(command);
  }

  /**
   * T216 - US6: Unassign user from card
   */
  @Delete('cards/:id/assignments/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign a user from a card' })
  @ApiOkResponse({
    description: 'User unassigned successfully',
  })
  async unassignCard(
    @Param('id') cardId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const unassignedBy = 'temp-user-id'; // TODO: Extract from JWT token
    const command = new UnassignCardCommand(cardId, userId, unassignedBy);
    await this.commandBus.execute(command);
  }

  /**
   * T217 - US6: Get cards assigned to current user
   */
  @Get('cards/assigned-to-me')
  @ApiOperation({
    summary: 'Get all cards assigned to current user',
    description:
      'Returns paginated list of cards assigned to the authenticated user',
  })
  @ApiOkResponse({
    description: 'Assigned cards retrieved successfully',
  })
  async getAssignedCards(): Promise<any> {
    const userId = 'temp-user-id'; // TODO: Extract from JWT token
    const page = 1; // TODO: Get from query params
    const limit = 50; // TODO: Get from query params

    const query = new GetAssignedCardsQuery(userId, page, limit);
    return await this.queryBus.execute(query);
  }

  /**
   * Helper method to map Card domain model to CardResponseDto
   */
  private mapToResponse(card: Card): CardResponseDto {
    const response = new CardResponseDto();
    response.id = card.id;
    response.listId = card.listId;
    response.title = card.title;
    response.description = card.description ?? undefined;
    response.position = card.position;
    response.dueDate = card.dueDate ?? undefined;
    response.isArchived = card.isArchived;
    response.createdBy = card.createdBy;
    response.createdAt = card.createdAt;
    response.updatedAt = card.updatedAt;
    return response;
  }
}
