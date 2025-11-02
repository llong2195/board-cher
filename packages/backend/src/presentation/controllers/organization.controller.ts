/**
 * T191 [US4] OrganizationController
 * User Story 4: Team Organization and Access Control
 *
 * Controller for organization CRUD operations and member management
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrganizationCommand } from '../../application/commands/organization/create-organization.handler';
import { InviteMemberCommand } from '../../application/commands/organization/invite-member.handler';
import { RemoveMemberCommand } from '../../application/commands/organization/remove-member.handler';
import { ChangeMemberRoleCommand } from '../../application/commands/organization/change-member-role.handler';
import {
  GetOrganizationQuery,
  GetUserOrganizationsQuery,
  GetOrganizationMembersQuery,
} from '../../application/queries/organization/get-organization.handler';
import { Organization } from '../../domain/organization/organization.model';
import { OrganizationMember } from '../../domain/organization/organization-member.model';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { OrganizationPermissionGuard } from '../../infrastructure/auth/guards/organization-permission.guard';
import {
  CreateOrganizationDto,
  InviteMemberDto,
  ChangeMemberRoleDto,
  OrganizationResponseDto,
  OrganizationMemberResponseDto,
} from '../dto/organization';

/**
 * Controller for organization and member management
 */
@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new organization
   */
  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiCreatedResponse({
    description: 'Organization created successfully',
    type: OrganizationResponseDto,
  })
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const command = new CreateOrganizationCommand(
      dto.name,
      dto.description || null,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const organization = await this.commandBus.execute<
      CreateOrganizationCommand,
      Organization
    >(command);

    return this.mapOrganizationToResponse(organization);
  }

  /**
   * Get all organizations for the current user
   */
  @Get()
  @ApiOperation({ summary: 'List organizations for current user' })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully',
    type: [OrganizationResponseDto],
  })
  async listOrganizations(): Promise<OrganizationResponseDto[]> {
    const query = new GetUserOrganizationsQuery(
      'temp-user-id', // TODO: Extract from JWT token
    );

    const organizations = await this.queryBus.execute<
      GetUserOrganizationsQuery,
      Organization[]
    >(query);

    return organizations.map((org) => this.mapOrganizationToResponse(org));
  }

  /**
   * Get organization by ID
   * T192: Requires organization membership
   */
  @Get(':id')
  @UseGuards(OrganizationPermissionGuard)
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiOkResponse({
    description: 'Organization retrieved successfully',
    type: OrganizationResponseDto,
  })
  async getOrganization(
    @Param('id') id: string,
  ): Promise<OrganizationResponseDto> {
    const query = new GetOrganizationQuery(
      id,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const organization = await this.queryBus.execute<
      GetOrganizationQuery,
      Organization
    >(query);

    return this.mapOrganizationToResponse(organization);
  }

  /**
   * Get organization members
   * T192: Requires organization membership
   */
  @Get(':id/members')
  @UseGuards(OrganizationPermissionGuard)
  @ApiOperation({ summary: 'Get organization members' })
  @ApiOkResponse({
    description: 'Members retrieved successfully',
    type: [OrganizationMemberResponseDto],
  })
  async getMembers(
    @Param('id') organizationId: string,
  ): Promise<OrganizationMemberResponseDto[]> {
    const query = new GetOrganizationMembersQuery(
      organizationId,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const members = await this.queryBus.execute<
      GetOrganizationMembersQuery,
      OrganizationMember[]
    >(query);

    return members.map((member) => this.mapMemberToResponse(member));
  }

  /**
   * Invite member to organization
   * T192: Requires organization membership (admin/owner permissions checked in handler)
   */
  @Post(':id/members')
  @UseGuards(OrganizationPermissionGuard)
  @ApiOperation({ summary: 'Invite member to organization' })
  @ApiCreatedResponse({
    description: 'Member invited successfully',
    type: OrganizationMemberResponseDto,
  })
  async inviteMember(
    @Param('id') organizationId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<OrganizationMemberResponseDto> {
    const command = new InviteMemberCommand(
      organizationId,
      dto.userId,
      dto.role,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const member = await this.commandBus.execute<
      InviteMemberCommand,
      OrganizationMember
    >(command);

    return this.mapMemberToResponse(member);
  }

  /**
   * Change member role
   * T192: Requires organization membership (admin/owner permissions checked in handler)
   */
  @Put(':id/members/:userId/role')
  @UseGuards(OrganizationPermissionGuard)
  @ApiOperation({ summary: 'Change member role' })
  @ApiOkResponse({
    description: 'Member role changed successfully',
    type: OrganizationMemberResponseDto,
  })
  async changeMemberRole(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @Body() dto: ChangeMemberRoleDto,
  ): Promise<OrganizationMemberResponseDto> {
    const command = new ChangeMemberRoleCommand(
      organizationId,
      userId,
      dto.role,
      'temp-user-id', // TODO: Extract from JWT token
    );

    const member = await this.commandBus.execute<
      ChangeMemberRoleCommand,
      OrganizationMember
    >(command);

    return this.mapMemberToResponse(member);
  }

  /**
   * Remove member from organization
   * T192: Requires organization membership (admin/owner permissions checked in handler)
   */
  @Delete(':id/members/:userId')
  @UseGuards(OrganizationPermissionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiNoContentResponse({
    description: 'Member removed successfully',
  })
  async removeMember(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const command = new RemoveMemberCommand(
      organizationId,
      userId,
      'temp-user-id', // TODO: Extract from JWT token
    );

    await this.commandBus.execute(command);
  }

  /**
   * Map Organization domain model to DTO
   */
  private mapOrganizationToResponse(
    organization: Organization,
  ): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.description = organization.description;
    dto.createdAt = organization.createdAt;
    dto.updatedAt = organization.updatedAt;
    return dto;
  }

  /**
   * Map OrganizationMember domain model to DTO
   */
  private mapMemberToResponse(
    member: OrganizationMember,
  ): OrganizationMemberResponseDto {
    const dto = new OrganizationMemberResponseDto();
    dto.id = member.id;
    dto.organizationId = member.organizationId;
    dto.userId = member.userId;
    dto.role = member.role;
    dto.joinedAt = member.joinedAt;
    return dto;
  }
}
