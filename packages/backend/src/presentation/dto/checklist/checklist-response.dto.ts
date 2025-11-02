import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for checklist item response (T148)
 * User Story 2: Enrich Cards with Details
 */
export class ChecklistItemResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the checklist item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Item text',
    example: 'Write unit tests',
  })
  text!: string;

  @ApiProperty({
    description: 'Whether the item is completed',
    example: false,
  })
  isCompleted!: boolean;

  @ApiProperty({
    description: 'Position within checklist',
    example: 0,
  })
  position!: number;
}

/**
 * DTO for checklist response (T148)
 * User Story 2: Enrich Cards with Details
 */
export class ChecklistResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the checklist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Card ID the checklist belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'Checklist name',
    example: 'Development Tasks',
  })
  name!: string;

  @ApiProperty({
    description: 'Position for ordering',
    example: 0,
  })
  position!: number;

  @ApiProperty({
    description: 'Checklist items',
    type: [ChecklistItemResponseDto],
  })
  items!: ChecklistItemResponseDto[];

  @ApiProperty({
    description: 'Completion progress',
    example: { completed: 2, total: 5, percentage: 40 },
  })
  progress!: {
    completed: number;
    total: number;
    percentage: number;
  };

  @ApiProperty({
    description: 'Whether all items are completed',
    example: false,
  })
  isComplete!: boolean;

  @ApiProperty({
    description: 'Timestamp when the checklist was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the checklist was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
