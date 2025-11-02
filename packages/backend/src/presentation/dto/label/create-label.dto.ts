import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a label (T147)
 * User Story 2: Enrich Cards with Details
 */
export class CreateLabelDto {
  @ApiProperty({
    description: 'Label color (predefined palette)',
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
  @IsString()
  @IsNotEmpty()
  @IsIn([
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
  ])
  color!: string;

  @ApiProperty({
    description: 'Optional label name (color-only labels supported)',
    example: 'Urgent',
    required: false,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;
}
