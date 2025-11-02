import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating an existing board
 */
export class UpdateBoardDto {
  @ApiProperty({
    description: 'The name of the board',
    example: 'Updated Sprint Planning Board',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the board',
    example: 'Updated board description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color theme for the board',
    example: '#3498db',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
