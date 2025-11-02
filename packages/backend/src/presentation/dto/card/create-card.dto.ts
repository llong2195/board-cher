import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new card
 */
export class CreateCardDto {
  @ApiProperty({
    description: 'The title of the card',
    example: 'Implement user authentication',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Optional description of the card',
    example: 'Add JWT-based authentication system',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
