import {
  Body,
  Controller,
  Delete,
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
import { CreateChecklistCommand } from '../../application/commands/checklist/create-checklist.command';
import { ToggleChecklistItemCommand } from '../../application/commands/checklist/toggle-item.command';
import { Checklist } from '../../domain/checklist/checklist.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AddChecklistItemDto } from '../dto/checklist/add-checklist-item.dto';
import { ChecklistResponseDto } from '../dto/checklist/checklist-response.dto';
import { CreateChecklistDto } from '../dto/checklist/create-checklist.dto';

/**
 * Controller for checklist operations (T152)
 * Implements User Story 2: Enrich Cards with Details
 */
@ApiTags('checklists')
@Controller()
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new checklist for a card
   */
  @Post('cards/:cardId/checklists')
  @ApiOperation({ summary: 'Create a new checklist for a card' })
  @ApiCreatedResponse({
    description: 'Checklist created successfully',
    type: ChecklistResponseDto,
  })
  async createChecklist(
    @Param('cardId') cardId: string,
    @Body() dto: CreateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    const command = new CreateChecklistCommand(
      cardId,
      'temp-user-id', // TODO: Extract from JWT token
      dto.name,
      dto.position,
    );

    const checklist = await this.commandBus.execute<
      CreateChecklistCommand,
      Checklist
    >(command);
    return this.mapToResponse(checklist);
  }

  /**
   * Add an item to a checklist
   */
  @Post('checklists/:checklistId/items')
  @ApiOperation({ summary: 'Add an item to a checklist' })
  @ApiCreatedResponse({
    description: 'Checklist item added successfully',
    type: ChecklistResponseDto,
  })
  addChecklistItem(
    @Param('checklistId') _checklistId: string,
    @Body() _dto: AddChecklistItemDto,
  ): Promise<ChecklistResponseDto> {
    // TODO: Implement add checklist item command
    throw new Error('Add checklist item not yet implemented');
  }

  /**
   * Toggle a checklist item's completion status
   */
  @Put('checklist-items/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle a checklist item completion status' })
  @ApiOkResponse({
    description: 'Checklist item toggled successfully',
    type: ChecklistResponseDto,
  })
  async toggleChecklistItem(
    @Param('itemId') itemId: string,
  ): Promise<ChecklistResponseDto> {
    const command = new ToggleChecklistItemCommand(
      itemId,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const checklist = await this.commandBus.execute<
      ToggleChecklistItemCommand,
      Checklist
    >(command);
    return this.mapToResponse(checklist);
  }

  /**
   * Delete a checklist
   */
  @Delete('checklists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a checklist' })
  @ApiNoContentResponse({ description: 'Checklist deleted successfully' })
  deleteChecklist(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete checklist command
    throw new Error('Delete checklist not yet implemented');
  }

  /**
   * Delete a checklist item
   */
  @Delete('checklist-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a checklist item' })
  @ApiNoContentResponse({ description: 'Checklist item deleted successfully' })
  deleteChecklistItem(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete checklist item command
    throw new Error('Delete checklist item not yet implemented');
  }

  /**
   * Helper method to map Checklist domain model to ChecklistResponseDto
   */
  private mapToResponse(checklist: Checklist): ChecklistResponseDto {
    const response = new ChecklistResponseDto();
    response.id = checklist.id;
    response.cardId = checklist.cardId;
    response.name = checklist.name;
    response.position = checklist.position;
    response.items = checklist.getItems().map((item) => ({
      id: item.id,
      text: item.text,
      isCompleted: item.isCompleted,
      position: item.position,
    }));
    response.progress = checklist.getProgress();
    response.isComplete = checklist.isComplete();
    response.createdAt = checklist.createdAt;
    response.updatedAt = checklist.updatedAt;
    return response;
  }
}
