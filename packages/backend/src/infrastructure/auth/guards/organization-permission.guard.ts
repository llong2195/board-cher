/**
 * T188 [US4] Organization Permission Guard
 * User Story 4: Team Organization and Access Control
 *
 * Verifies that the authenticated user has access to the requested organization.
 * Checks organization membership before allowing access to organization resources.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, OrganizationPermissionGuard)
 *
 * This guard can be used on organization endpoints to ensure only members
 * can access organization data.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../../persistence/entities/organization.entity';
import { OrganizationMemberEntity } from '../../persistence/entities/organization-member.entity';

@Injectable()
export class OrganizationPermissionGuard implements CanActivate {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly memberRepository: Repository<OrganizationMemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const organizationId = this.extractOrganizationId(request);

    if (!organizationId) {
      // If no organization context, allow (e.g., listing all organizations)
      return true;
    }

    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is a member of the organization
    const membership = await this.memberRepository.findOne({
      where: {
        organizationId,
        userId: user.id,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    // Attach organization and membership to request for downstream use
    request.organization = organization;
    request.organizationMembership = membership;

    return true;
  }

  /**
   * Extract organization ID from the request
   */
  private extractOrganizationId(
    request: Request & { params: any },
  ): string | null {
    const params = request.params;

    // Direct organization access via organizationId or id param
    if (params.organizationId) {
      return params.organizationId as string;
    }

    if (params.id) {
      const path = request.route?.path || request.url;
      // Check if this is an organization route
      if (path.includes('/organizations/:id')) {
        return params.id as string;
      }
    }

    return null;
  }
}
