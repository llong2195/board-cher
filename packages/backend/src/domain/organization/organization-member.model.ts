/**
 * T177 [US4] OrganizationMember Domain Model
 * User Story 4: Team Organization and Access Control
 *
 * Represents a user's membership in an organization with a specific role.
 *
 * Domain Rules:
 * - Each user can only have one role per organization
 * - Organization must have at least one owner
 * - Owners and admins can manage members
 * - Members can create/edit boards
 * - Guests can only view boards
 */

import { v4 as uuidv4 } from 'uuid';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export class OrganizationMember {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public role: OrganizationRole,
    public readonly invitedBy: string,
    public readonly joinedAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * Factory method to create a new member
   */
  static create(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
    invitedBy: string,
  ): OrganizationMember {
    const now = new Date();
    return new OrganizationMember(
      uuidv4(),
      organizationId,
      userId,
      role,
      invitedBy,
      now,
      now,
    );
  }

  /**
   * Factory method to reconstitute from persistence
   */
  static fromPersistence(
    id: string,
    organizationId: string,
    userId: string,
    role: OrganizationRole,
    invitedBy: string,
    joinedAt: Date,
    updatedAt: Date,
  ): OrganizationMember {
    return new OrganizationMember(
      id,
      organizationId,
      userId,
      role,
      invitedBy,
      joinedAt,
      updatedAt,
    );
  }

  /**
   * Change member's role
   */
  changeRole(newRole: OrganizationRole): void {
    this.role = newRole;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Check if member has permission to perform an action
   */
  canManageMembers(): boolean {
    return (
      this.role === OrganizationRole.OWNER ||
      this.role === OrganizationRole.ADMIN
    );
  }

  canEditBoards(): boolean {
    return (
      this.role === OrganizationRole.OWNER ||
      this.role === OrganizationRole.ADMIN ||
      this.role === OrganizationRole.MEMBER
    );
  }

  canViewBoards(): boolean {
    return true; // All members can view boards
  }

  isOwner(): boolean {
    return this.role === OrganizationRole.OWNER;
  }

  /**
   * Validate member invariants
   */
  private validate(): void {
    if (!Object.values(OrganizationRole).includes(this.role)) {
      throw new Error(`Invalid organization role: ${this.role}`);
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      userId: this.userId,
      role: this.role,
      invitedBy: this.invitedBy,
      joinedAt: this.joinedAt,
      updatedAt: this.updatedAt,
    };
  }
}
