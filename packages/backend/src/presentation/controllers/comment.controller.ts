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
import { AddCommentCommand } from '../../application/commands/comment/add-comment.command';
import { Comment } from '../../domain/comment/comment.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CommentResponseDto } from '../dto/comment/comment-response.dto';
import { CreateCommentDto } from '../dto/comment/create-comment.dto';

/**
 * Controller for comment operations (T149)
 * Implements User Story 2: Enrich Cards with Details
 */
@ApiTags('comments')
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Get all comments for a card
   */
  @Get('cards/:cardId/comments')
  @ApiOperation({ summary: 'Get all comments for a card' })
  @ApiOkResponse({
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  getCardComments(
    @Param('cardId') _cardId: string,
  ): Promise<CommentResponseDto[]> {
    // TODO: Implement query handler for getting card comments
    throw new Error('Get card comments not yet implemented');
  }

  /**
   * Add a comment to a card
   */
  @Post('cards/:cardId/comments')
  @ApiOperation({ summary: 'Add a comment to a card' })
  @ApiCreatedResponse({
    description: 'Comment added successfully',
    type: CommentResponseDto,
  })
  async addComment(
    @Param('cardId') cardId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const command = new AddCommentCommand(
      cardId,
      'temp-user-id', // TODO: Extract from JWT token
      dto.content,
    );

    const comment = await this.commandBus.execute<AddCommentCommand, Comment>(
      command,
    );
    return this.mapToResponse(comment);
  }

  /**
   * Delete a comment
   */
  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiNoContentResponse({ description: 'Comment deleted successfully' })
  deleteComment(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete comment command
    throw new Error('Delete comment not yet implemented');
  }

  /**
   * Helper method to map Comment domain model to CommentResponseDto
   */
  private mapToResponse(comment: Comment): CommentResponseDto {
    const response = new CommentResponseDto();
    response.id = comment.id;
    response.cardId = comment.cardId;
    response.userId = comment.userId;
    response.content = comment.content;
    response.isEdited = comment.isEdited;
    response.createdAt = comment.createdAt;
    response.updatedAt = comment.updatedAt;
    return response;
  }
}
