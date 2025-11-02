/**
 * T190 [US4] OrganizationResponseDto
 * User Story 4: Team Organization and Access Control
 *
 * DTO for organization response
 */

import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the organization',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Name of the organization',
    example: 'Acme Corporation',
  })
  name!: string;

  @ApiProperty({
    description: 'Description of the organization',
    example: 'A leading software development company',
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Timestamp when the organization was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the organization was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
