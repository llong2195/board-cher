import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for board response
 */
export class BoardResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization ID the board belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId!: string;

  @ApiProperty({
    description: 'Name of the board',
    example: 'Sprint Planning Board',
  })
  name!: string;

  @ApiProperty({
    description: 'Description of the board',
    example: 'Board for managing sprint tasks',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Color theme of the board',
    example: '#FF5733',
    required: false,
  })
  color?: string;

  @ApiProperty({
    description: 'Whether the board is archived',
    example: false,
  })
  isArchived!: boolean;

  @ApiProperty({
    description: 'User ID who created the board',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Timestamp when the board was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the board was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
