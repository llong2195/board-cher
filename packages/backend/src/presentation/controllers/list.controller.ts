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
import { CreateListCommand } from '../../application/commands/list/create-list.command';
import { MoveListCommand } from '../../application/commands/list/move-list.command';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { BoardPermissionGuard } from '../../infrastructure/auth/guards/board-permission.guard';
import { CreateListDto } from '../dto/list/create-list.dto';
import { ListResponseDto } from '../dto/list/list-response.dto';
import { MoveListDto } from '../dto/list/move-list.dto';

/**
 * Controller for list operations
 * Implements User Story 1: Kanban Board CRUD
 * T193: BoardPermissionGuard applied to all list endpoints
 */
@ApiTags('lists')
@Controller()
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
export class ListController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new list in a board
   */
  @Post('boards/:boardId/lists')
  @ApiOperation({ summary: 'Create a new list in a board' })
  @ApiCreatedResponse({
    description: 'List created successfully',
    type: ListResponseDto,
  })
  async createList(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
  ): Promise<ListResponseDto> {
    const command = new CreateListCommand(
      boardId,
      'temp-user-id', // TODO: Extract from JWT token
      dto.name,
    );
    const list = await this.commandBus.execute(command);
    return this.mapToResponse(list);
  }

  /**
   * Get all lists in a board
   */
  @Get('boards/:boardId/lists')
  @ApiOperation({ summary: 'Get all lists in a board' })
  @ApiOkResponse({
    description: 'Lists retrieved successfully',
    type: [ListResponseDto],
  })
  getBoardLists(
    @Param('boardId') _boardId: string,
  ): Promise<ListResponseDto[]> {
    // TODO: Implement query handler for getting board lists
    // For now, return empty array as placeholder
    return Promise.resolve([]);
  }

  /**
   * Update/Move a list
   */
  @Put('lists/:id')
  @ApiOperation({ summary: 'Update or move a list' })
  @ApiOkResponse({
    description: 'List updated successfully',
    type: ListResponseDto,
  })
  async moveList(
    @Param('id') id: string,
    @Body() dto: MoveListDto,
  ): Promise<ListResponseDto> {
    // If position is provided, use MoveListCommand
    if (dto.position !== undefined) {
      const command = new MoveListCommand(
        id,
        'temp-user-id', // TODO: Extract from JWT token
        dto.position,
      );
      const list = await this.commandBus.execute(command);
      return this.mapToResponse(list);
    }

    // TODO: Handle name update separately if needed
    throw new Error('Name-only update not yet implemented');
  }

  /**
   * Delete a list
   */
  @Delete('lists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a list' })
  @ApiNoContentResponse({ description: 'List deleted successfully' })
  deleteList(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete list command
    throw new Error('Delete list not yet implemented');
  }

  /**
   * Helper method to map List domain model to ListResponseDto
   */
  private mapToResponse(list: any): ListResponseDto {
    const response = new ListResponseDto();
    response.id = list.id;
    response.boardId = list.boardId;
    response.name = list.name;
    response.position = list.position;
    response.createdAt = list.createdAt;
    response.updatedAt = list.updatedAt;
    return response;
  }
}
