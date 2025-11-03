/**
 * T215 - Paginated Cards Response DTO
 * User Story 6: Card Assignment and Notifications
 */

import { ApiProperty } from '@nestjs/swagger';
import { CardResponseDto } from './card-response.dto';

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total!: number;
}

export class PaginatedCardsResponseDto {
  @ApiProperty({
    description: 'Array of cards',
    type: [CardResponseDto],
  })
  data!: CardResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination!: PaginationDto;
}
