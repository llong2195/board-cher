import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for label response (T147)
 * User Story 2: Enrich Cards with Details
 */
export class LabelResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the label',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Board ID the label belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  boardId!: string;

  @ApiProperty({
    description: 'Label name (null for color-only labels)',
    example: 'Urgent',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Label color',
    example: 'red',
    enum: [
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
      'pink',
      'gray',
      'brown',
      'black',
    ],
  })
  color!: string;

  @ApiProperty({
    description: 'Hex color code for UI rendering',
    example: '#ef4444',
  })
  hexColor!: string;

  @ApiProperty({
    description: 'Display text (name or color)',
    example: 'Urgent',
  })
  displayText!: string;

  @ApiProperty({
    description: 'Whether this is a color-only label',
    example: false,
  })
  isColorOnly!: boolean;

  @ApiProperty({
    description: 'Timestamp when the label was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the label was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
