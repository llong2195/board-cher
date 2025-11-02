import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for list response
 */
export class ListResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the list',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Board ID the list belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  boardId!: string;

  @ApiProperty({
    description: 'Name of the list',
    example: 'To Do',
  })
  name!: string;

  @ApiProperty({
    description: 'Position of the list within the board',
    example: 0,
  })
  position!: number;

  @ApiProperty({
    description: 'Timestamp when the list was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the list was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
