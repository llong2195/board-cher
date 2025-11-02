/**
 * T178 [US4] OrganizationRepository Interface
 * User Story 4: Team Organization and Access Control
 *
 * Repository interface for Organization aggregate.
 * Following DDD pattern - defines contract for persistence.
 */

import { Organization } from './organization.model';
import {
  OrganizationMember,
  OrganizationRole,
} from './organization-member.model';

export interface OrganizationRepository {
  /**
   * Save a new or existing organization
   */
  save(organization: Organization): Promise<Organization>;

  /**
   * Find organization by ID
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Find all organizations for a user
   */
  findByUserId(userId: string): Promise<Organization[]>;

  /**
   * Delete an organization
   */
  delete(id: string): Promise<void>;

  /**
   * Add a member to an organization
   */
  addMember(member: OrganizationMember): Promise<OrganizationMember>;

  /**
   * Remove a member from an organization
   */
  removeMember(organizationId: string, userId: string): Promise<void>;

  /**
   * Update a member's role
   */
  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<void>;

  /**
   * Get member by organization and user
   */
  findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null>;

  /**
   * Get all members of an organization
   */
  findMembers(organizationId: string): Promise<OrganizationMember[]>;

  /**
   * Check if user is a member of organization
   */
  isMember(organizationId: string, userId: string): Promise<boolean>;
}
