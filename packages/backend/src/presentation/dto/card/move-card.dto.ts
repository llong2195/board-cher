import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

/**
 * DTO for moving a card to a different list or position
 */
export class MoveCardDto {
  @ApiProperty({
    description: 'Target list ID to move the card to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  targetListId!: string;

  @ApiProperty({
    description: 'New position of the card in the target list',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  position!: number;
}
