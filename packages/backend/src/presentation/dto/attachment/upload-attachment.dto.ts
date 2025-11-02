import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for uploading an attachment (T146)
 * User Story 2: Enrich Cards with Details
 *
 * Note: This is used with multipart/form-data
 * The actual file is handled by NestJS @UploadedFile decorator
 */
export class UploadAttachmentDto {
  @ApiProperty({
    description: 'Display name for the attachment',
    example: 'Design Mockup',
    required: false,
  })
  name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload (max 10MB)',
  })
  file!: any;
}
