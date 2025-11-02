import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for creating a new board
 */
export class CreateBoardDto {
  @ApiProperty({
    description: 'The organization ID the board belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description: 'The name of the board',
    example: 'Sprint Planning Board',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Optional description of the board',
    example: 'Board for managing sprint tasks',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Optional color theme for the board',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
