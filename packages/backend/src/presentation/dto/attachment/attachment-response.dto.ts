import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for attachment response (T146)
 * User Story 2: Enrich Cards with Details
 */
export class AttachmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the attachment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Card ID the attachment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'User ID who uploaded the attachment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Display name of the attachment',
    example: 'Design Mockup',
  })
  name!: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'mockup.png',
  })
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  size!: number;

  @ApiProperty({
    description: 'Human-readable file size',
    example: '1.0 MB',
  })
  formattedSize!: string;

  @ApiProperty({
    description: 'Public URL to access the file',
    example: 'http://localhost:3000/api/attachments/2024/11/uuid-mockup.png',
  })
  url!: string;

  @ApiProperty({
    description: 'Whether this is an image file',
    example: true,
  })
  isImage!: boolean;

  @ApiProperty({
    description: 'File extension',
    example: 'png',
  })
  extension!: string;

  @ApiProperty({
    description: 'Timestamp when the attachment was uploaded',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the attachment was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
