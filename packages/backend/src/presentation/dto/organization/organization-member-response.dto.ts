/**
 * T190 [US4] OrganizationMemberResponseDto
 * User Story 4: Team Organization and Access Control
 *
 * DTO for organization member response
 */

import { ApiProperty } from '@nestjs/swagger';
import { OrganizationRole } from '../../../infrastructure/persistence/entities/organization-member.entity';

export class OrganizationMemberResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the membership',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId!: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Member role in the organization',
    enum: OrganizationRole,
    example: OrganizationRole.MEMBER,
  })
  role!: OrganizationRole;

  @ApiProperty({
    description: 'Timestamp when the member joined',
    example: '2024-01-01T00:00:00.000Z',
  })
  joinedAt!: Date;
}
