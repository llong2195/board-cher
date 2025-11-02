import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

/**
 * DTO for creating a checklist (T148)
 * User Story 2: Enrich Cards with Details
 */
export class CreateChecklistDto {
  @ApiProperty({
    description: 'Checklist name',
    example: 'Development Tasks',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Position for ordering (auto-calculated if not provided)',
    example: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}
