import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UploadAttachmentCommand } from '../../application/commands/attachment/upload-attachment.command';
import { Attachment } from '../../domain/attachment/attachment.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AttachmentResponseDto } from '../dto/attachment/attachment-response.dto';
import { UploadAttachmentDto } from '../dto/attachment/upload-attachment.dto';

/**
 * Controller for attachment operations (T150)
 * Implements User Story 2: Enrich Cards with Details
 */
@ApiTags('attachments')
@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Upload an attachment to a card
   */
  @Post('cards/:cardId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a card' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAttachmentDto })
  @ApiCreatedResponse({
    description: 'Attachment uploaded successfully',
    type: AttachmentResponseDto,
  })
  async uploadAttachment(
    @Param('cardId') cardId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new Error('File is required');
    }

    const command = new UploadAttachmentCommand(
      cardId,
      'temp-user-id', // TODO: Extract from JWT token
      {
        name: name || file.originalname,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
    );

    const attachment = await this.commandBus.execute<
      UploadAttachmentCommand,
      Attachment
    >(command);
    return this.mapToResponse(attachment);
  }

  /**
   * Download an attachment
   */
  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Download an attachment' })
  @ApiOkResponse({
    description: 'Attachment downloaded successfully',
  })
  downloadAttachment(@Param('id') _id: string, @Res() _res: Response): void {
    // TODO: Implement query handler to get attachment and stream file
    throw new Error('Download attachment not yet implemented');
  }

  /**
   * Delete an attachment
   */
  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiNoContentResponse({ description: 'Attachment deleted successfully' })
  deleteAttachment(@Param('id') _id: string): Promise<void> {
    // TODO: Implement delete attachment command
    throw new Error('Delete attachment not yet implemented');
  }

  /**
   * Helper method to map Attachment domain model to AttachmentResponseDto
   */
  private mapToResponse(attachment: Attachment): AttachmentResponseDto {
    const response = new AttachmentResponseDto();
    response.id = attachment.id;
    response.cardId = attachment.cardId;
    response.userId = attachment.userId;
    response.name = attachment.name;
    response.filename = attachment.filename;
    response.mimeType = attachment.mimeType;
    response.size = attachment.size;
    response.formattedSize = attachment.getFormattedSize();
    response.url = attachment.url;
    response.isImage = attachment.isImage();
    response.extension = attachment.getExtension();
    response.createdAt = attachment.createdAt;
    response.updatedAt = attachment.updatedAt;
    return response;
  }
}
