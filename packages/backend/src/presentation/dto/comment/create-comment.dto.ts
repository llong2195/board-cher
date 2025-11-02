import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for creating a comment (T145)
 * User Story 2: Enrich Cards with Details
 */
export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text content',
    example: 'Started working on this task',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;
}
