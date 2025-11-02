/**
 * T190 [US4] InviteMemberDto
 * User Story 4: Team Organization and Access Control
 *
 * DTO for inviting a member to an organization
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { OrganizationRole } from '../../../infrastructure/persistence/entities/organization-member.entity';

export class InviteMemberDto {
  @ApiProperty({
    description: 'The user ID to invite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'The role to assign to the member',
    enum: OrganizationRole,
    example: OrganizationRole.MEMBER,
  })
  @IsEnum(OrganizationRole)
  @IsNotEmpty()
  role!: OrganizationRole;
}
