import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for card response
 */
export class CardResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the card',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'List ID the card belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  listId!: string;

  @ApiProperty({
    description: 'Title of the card',
    example: 'Implement user authentication',
  })
  title!: string;

  @ApiProperty({
    description: 'Description of the card',
    example: 'Add JWT-based authentication system',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Position of the card within the list',
    example: 0,
  })
  position!: number;

  @ApiProperty({
    description: 'Due date for the card',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Whether the card is archived',
    example: false,
  })
  isArchived!: boolean;

  @ApiProperty({
    description: 'User ID who created the card',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Timestamp when the card was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the card was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
