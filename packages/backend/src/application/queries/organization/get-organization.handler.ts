/**
 * T185 [US4] Organization Query Handlers
 * User Story 4: Team Organization and Access Control
 *
 * CQRS Queries for retrieving organization data.
 */

import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrganizationMember } from '../../../domain/organization/organization-member.model';
import { Organization } from '../../../domain/organization/organization.model';
import { OrganizationRepository } from '../../../domain/organization/organization.repository';

/**
 * Query to get a single organization by ID
 */
export class GetOrganizationQuery {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetOrganizationQuery)
export class GetOrganizationHandler
  implements IQueryHandler<GetOrganizationQuery>
{
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(query: GetOrganizationQuery): Promise<Organization> {
    const organization = await this.organizationRepository.findById(
      query.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${query.organizationId} not found`,
      );
    }

    // Verify user is a member
    const isMember = await this.organizationRepository.isMember(
      query.organizationId,
      query.userId,
    );
    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member to view this organization',
      );
    }

    return organization;
  }
}

/**
 * Query to get all organizations for a user
 */
export class GetUserOrganizationsQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(GetUserOrganizationsQuery)
export class GetUserOrganizationsHandler
  implements IQueryHandler<GetUserOrganizationsQuery>
{
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(query: GetUserOrganizationsQuery): Promise<Organization[]> {
    return this.organizationRepository.findByUserId(query.userId);
  }
}

/**
 * Query to get all members of an organization
 */
export class GetOrganizationMembersQuery {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetOrganizationMembersQuery)
export class GetOrganizationMembersHandler
  implements IQueryHandler<GetOrganizationMembersQuery>
{
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    query: GetOrganizationMembersQuery,
  ): Promise<OrganizationMember[]> {
    // Verify organization exists
    const organization = await this.organizationRepository.findById(
      query.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${query.organizationId} not found`,
      );
    }

    // Verify user is a member
    const isMember = await this.organizationRepository.isMember(
      query.organizationId,
      query.userId,
    );
    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member to view organization members',
      );
    }

    return this.organizationRepository.findMembers(query.organizationId);
  }
}
