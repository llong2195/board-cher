/**
 * T257 - Activity Controller
 * User Story 7: Activity History and Audit Trail
 *
 * REST API endpoints for querying activity history.
 * Provides GET /cards/:id/activity and GET /boards/:id/activity
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { BoardPermissionGuard } from '../../infrastructure/auth/guards/board-permission.guard';
import { GetCardActivityQuery } from '../../application/queries/activity/get-card-activity.query';
import { GetBoardActivityQuery } from '../../application/queries/activity/get-board-activity.query';
import {
  ActivityResponseDto,
  PaginatedActivityResponseDto,
} from '../dto/activity/activity-response.dto';
import { Activity } from '../../domain/activity/activity.model';
import { ActivityEntity } from '../../infrastructure/persistence/entities/activity.entity';

/**
 * Controller for activity history queries
 */
@ApiTags('activities')
@Controller()
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
export class ActivityController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * Get activity history for a specific card
   */
  @Get('cards/:cardId/activity')
  @ApiOperation({ summary: 'Get activity history for a card' })
  @ApiParam({
    name: 'cardId',
    description: 'Card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Card activity retrieved successfully',
    type: PaginatedActivityResponseDto,
  })
  async getCardActivity(
    @Param('cardId') cardId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedActivityResponseDto> {
    const query = new GetCardActivityQuery(cardId, page, limit);

    const result = await this.queryBus.execute<
      GetCardActivityQuery,
      { data: ActivityEntity[]; pagination: any }
    >(query);

    return {
      data: result.data.map((entity) => this.mapToResponse(entity)),
      pagination: result.pagination,
    };
  }

  /**
   * Get activity history for a specific board
   */
  @Get('boards/:boardId/activity')
  @ApiOperation({ summary: 'Get activity history for a board' })
  @ApiParam({
    name: 'boardId',
    description: 'Board UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Board activity retrieved successfully',
    type: PaginatedActivityResponseDto,
  })
  async getBoardActivity(
    @Param('boardId') boardId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedActivityResponseDto> {
    const query = new GetBoardActivityQuery(boardId, page, limit);

    const result = await this.queryBus.execute<
      GetBoardActivityQuery,
      { data: ActivityEntity[]; pagination: any }
    >(query);

    return {
      data: result.data.map((entity) => this.mapToResponse(entity)),
      pagination: result.pagination,
    };
  }

  /**
   * Map ActivityEntity to ActivityResponseDto
   */
  private mapToResponse(entity: ActivityEntity): ActivityResponseDto {
    // Convert to domain model to get description
    const activity = new Activity(
      entity.id,
      entity.userId,
      entity.boardId,
      entity.cardId,
      entity.actionType,
      entity.entityType,
      entity.entityId,
      entity.metadata,
      entity.createdAt,
    );

    return {
      id: entity.id,
      userId: entity.userId,
      userName: entity.user?.name,
      boardId: entity.boardId,
      cardId: entity.cardId,
      actionType: entity.actionType,
      entityType: entity.entityType,
      entityId: entity.entityId,
      metadata: entity.metadata,
      description: activity.getDescription(),
      createdAt: entity.createdAt,
    };
  }
}
