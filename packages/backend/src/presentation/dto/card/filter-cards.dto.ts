import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsArray,
  IsUUID,
  IsString,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterCardsDto {
  @ApiProperty({
    description: 'Filter by label IDs (OR logic)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  labelId?: string[];

  @ApiProperty({
    description: 'Filter by assignee user IDs (OR logic)',
    example: ['660e8400-e29b-41d4-a716-446655440000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeId?: string[];

  @ApiProperty({
    description: 'Filter by due date (today | overdue | none)',
    example: 'today',
    enum: ['today', 'overdue', 'none'],
    required: false,
  })
  @IsOptional()
  @IsString()
  dueDateFilter?: 'today' | 'overdue' | 'none';

  @ApiProperty({
    description: 'Filter by due date start (ISO 8601 date)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDateStart?: string;

  @ApiProperty({
    description: 'Filter by due date end (ISO 8601 date)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDateEnd?: string;

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Number of results to skip for pagination',
    example: 0,
    default: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
