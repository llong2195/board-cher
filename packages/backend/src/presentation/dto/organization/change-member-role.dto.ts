/**
 * T190 [US4] ChangeMemberRoleDto
 * User Story 4: Team Organization and Access Control
 *
 * DTO for changing a member's role
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrganizationRole } from '../../../infrastructure/persistence/entities/organization-member.entity';

export class ChangeMemberRoleDto {
  @ApiProperty({
    description: 'The new role to assign to the member',
    enum: OrganizationRole,
    example: OrganizationRole.ADMIN,
  })
  @IsEnum(OrganizationRole)
  @IsNotEmpty()
  role!: OrganizationRole;
}
