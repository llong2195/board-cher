import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for comment response (T145)
 * User Story 2: Enrich Cards with Details
 */
export class CommentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the comment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Card ID the comment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'User ID who created the comment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Comment text content',
    example: 'Started working on this task',
  })
  content!: string;

  @ApiProperty({
    description: 'Whether the comment has been edited',
    example: false,
  })
  isEdited!: boolean;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the comment was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
