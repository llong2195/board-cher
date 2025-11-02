import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for creating a new list
 */
export class CreateListDto {
  @ApiProperty({
    description: 'The name of the list',
    example: 'To Do',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
