import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for moving a list (updating name and/or position)
 */
export class MoveListDto {
  @ApiProperty({
    description: 'Updated name of the list',
    example: 'In Progress',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'New position of the list within the board',
    example: 2,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
