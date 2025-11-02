import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsInt, Min } from 'class-validator';

/**
 * DTO for adding a checklist item (T148)
 * User Story 2: Enrich Cards with Details
 */
export class AddChecklistItemDto {
  @ApiProperty({
    description: 'Item text',
    example: 'Write unit tests',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  text!: string;

  @ApiProperty({
    description: 'Position for ordering',
    example: 0,
  })
  @IsInt()
  @Min(0)
  position!: number;
}
