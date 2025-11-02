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
  Query,
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
import { CreateBoardCommand } from '../../application/commands/board/create-board.command';
import { DeleteBoardCommand } from '../../application/commands/board/delete-board.command';
import { UpdateBoardCommand } from '../../application/commands/board/update-board.command';
import { GetBoardQuery } from '../../application/queries/board/get-board.query';
import { ListBoardsQuery } from '../../application/queries/board/list-boards.query';
import { Board } from '../../domain/board/board.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { BoardPermissionGuard } from '../../infrastructure/auth/guards/board-permission.guard';
import { BoardResponseDto } from '../dto/board/board-response.dto';
import { CreateBoardDto } from '../dto/board/create-board.dto';
import { UpdateBoardDto } from '../dto/board/update-board.dto';

/**
 * Controller for board CRUD operations
 * Implements User Story 1: Kanban Board CRUD
 * T193: BoardPermissionGuard applied to endpoints that access specific boards
 */
@ApiTags('boards')
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new board
   */
  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiCreatedResponse({
    description: 'Board created successfully',
    type: BoardResponseDto,
  })
  async createBoard(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    const command = new CreateBoardCommand(
      dto.organizationId,
      dto.name,
      'temp-user-id', // TODO: Extract from JWT token
      dto.description,
      dto.color,
    );

    const board = await this.commandBus.execute<CreateBoardCommand, Board>(
      command,
    );
    return this.mapToResponse(board);
  }

  /**
   * Get all boards with pagination
   */
  @Get()
  @ApiOperation({ summary: 'List boards with pagination' })
  @ApiOkResponse({
    description: 'Boards retrieved successfully',
    type: [BoardResponseDto],
  })
  async listBoards(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: BoardResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = new ListBoardsQuery(
      organizationId,
      'temp-user-id', // TODO: Extract from JWT token
      page || 1,
      limit || 20,
    );

    const result = await this.queryBus.execute<
      ListBoardsQuery,
      {
        boards: Board[];
        total: number;
        page: number;
        limit: number;
      }
    >(query);
    return {
      data: result.boards.map((board) => this.mapToResponse(board)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get board by ID
   * T193: Requires board permission check
   */
  @Get(':id')
  @UseGuards(BoardPermissionGuard)
  @ApiOperation({ summary: 'Get board details by ID' })
  @ApiOkResponse({
    description: 'Board retrieved successfully',
    type: BoardResponseDto,
  })
  async getBoard(@Param('id') id: string): Promise<BoardResponseDto> {
    const query = new GetBoardQuery(id, 'temp-user-id'); // TODO: Extract from JWT token
    const board = await this.queryBus.execute<GetBoardQuery, Board>(query);
    return this.mapToResponse(board);
  }

  /**
   * Update board
   * T193: Requires board permission check
   */
  @Put(':id')
  @UseGuards(BoardPermissionGuard)
  @ApiOperation({ summary: 'Update board' })
  @ApiOkResponse({
    description: 'Board updated successfully',
    type: BoardResponseDto,
  })
  async updateBoard(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    const command = new UpdateBoardCommand(
      id,
      'temp-user-id', // TODO: Extract from JWT token
      dto.name,
      dto.description,
      dto.color,
    );
    const board = await this.commandBus.execute<UpdateBoardCommand, Board>(
      command,
    );
    return this.mapToResponse(board);
  }

  /**
   * Delete board (soft delete by archiving)
   * T193: Requires board permission check
   */
  @Delete(':id')
  @UseGuards(BoardPermissionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete board (soft delete)' })
  @ApiNoContentResponse({ description: 'Board deleted successfully' })
  async deleteBoard(@Param('id') id: string): Promise<void> {
    const command = new DeleteBoardCommand(id, 'temp-user-id'); // TODO: Extract from JWT token
    await this.commandBus.execute(command);
  }

  /**
   * Helper method to map Board domain model to BoardResponseDto
   */
  private mapToResponse(board: Board): BoardResponseDto {
    const response = new BoardResponseDto();
    response.id = board.id;
    response.organizationId = board.organizationId;
    response.name = board.name;
    response.description = board.description ?? undefined;
    response.color = board.color ?? undefined;
    response.isArchived = board.isArchived;
    response.createdBy = board.createdBy;
    response.createdAt = board.createdAt;
    response.updatedAt = board.updatedAt;
    return response;
  }
}
