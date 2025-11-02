import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { ApplyLabelToCardCommand } from '../../application/commands/card/apply-label.command';
import { CreateLabelCommand } from '../../application/commands/label/create-label.command';
import { Label } from '../../domain/label/label.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { LabelResponseDto } from '../dto/label/label-response.dto';

/**
 * Controller for label operations (T151)
 * Implements User Story 2: Enrich Cards with Details
 */
@ApiTags('labels')
@Controller()
@UseGuards(JwtAuthGuard)
export class LabelController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Get all labels for a board
   */
  @Get('boards/:boardId/labels')
  @ApiOperation({ summary: 'Get all labels for a board' })
  @ApiOkResponse({
    description: 'Labels retrieved successfully',
    type: [LabelResponseDto],
  })
  getBoardLabels(
    @Param('boardId') _boardId: string,
  ): Promise<LabelResponseDto[]> {
    // TODO: Implement query handler for getting board labels
    throw new Error('Get board labels not yet implemented');
  }

  /**
   * Create a new label for a board
   */
  @Post('boards/:boardId/labels')
  @ApiOperation({ summary: 'Create a new label for a board' })
  @ApiCreatedResponse({
    description: 'Label created successfully',
    type: LabelResponseDto,
  })
  async createLabel(
    @Param('boardId') boardId: string,
    @Body() dto: CreateLabelDto,
  ): Promise<LabelResponseDto> {
    const command = new CreateLabelCommand(
      boardId,
      'temp-user-id', // TODO: Extract from JWT token
      dto.color,
      dto.name,
    );

    const label = await this.commandBus.execute<CreateLabelCommand, Label>(
      command,
    );
    return this.mapToResponse(label);
  }

  /**
   * Apply a label to a card
   */
  @Post('cards/:cardId/labels/:labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apply a label to a card' })
  @ApiNoContentResponse({ description: 'Label applied successfully' })
  async applyLabelToCard(
    @Param('cardId') cardId: string,
    @Param('labelId') labelId: string,
  ): Promise<void> {
    const command = new ApplyLabelToCardCommand(
      cardId,
      labelId,
      'temp-user-id', // TODO: Extract from JWT token
    );

    await this.commandBus.execute(command);
  }

  /**
   * Remove a label from a card
   */
  @Delete('cards/:cardId/labels/:labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a label from a card' })
  @ApiNoContentResponse({ description: 'Label removed successfully' })
  removeLabelFromCard(
    @Param('cardId') _cardId: string,
    @Param('labelId') _labelId: string,
  ): Promise<void> {
    // TODO: Implement remove label from card command
    throw new Error('Remove label from card not yet implemented');
  }

  /**
   * Helper method to map Label domain model to LabelResponseDto
   */
  private mapToResponse(label: Label): LabelResponseDto {
    const response = new LabelResponseDto();
    response.id = label.id;
    response.boardId = label.boardId;
    response.name = label.name;
    response.color = label.color;
    response.hexColor = label.getHexColor();
    response.displayText = label.getDisplayText();
    response.isColorOnly = label.isColorOnly();
    response.createdAt = label.createdAt;
    response.updatedAt = label.updatedAt;
    return response;
  }
}
