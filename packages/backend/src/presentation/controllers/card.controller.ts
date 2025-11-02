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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCardCommand } from '../../application/commands/card/create-card.command';
import { MoveCardCommand } from '../../application/commands/card/move-card.command';
import { Card } from '../../domain/card/card.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CardResponseDto } from '../dto/card/card-response.dto';
import { CreateCardDto } from '../dto/card/create-card.dto';
import { MoveCardDto } from '../dto/card/move-card.dto';

/**
 * Controller for card operations
 * Implements User Story 1: Kanban Board CRUD
 */
@ApiTags('cards')
@Controller()
@UseGuards(JwtAuthGuard)
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
   * Get all cards in a list
   */
  @Get('lists/:listId/cards')
  @ApiOperation({ summary: 'Get all cards in a list' })
  @ApiOkResponse({
    description: 'Cards retrieved successfully',
    type: [CardResponseDto],
  })
  getListCards(@Param('listId') _listId: string): CardResponseDto[] {
    // TODO: Implement query handler for getting list cards
    // For now, return empty array as placeholder
    return [];
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
