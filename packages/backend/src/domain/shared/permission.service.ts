/**
 * Permission Service (T180)
 * User Story 4: Team Organization and Access Control
 *
 * Centralized service for checking user permissions on resources.
 * Provides reusable permission checking logic for guards, controllers, and handlers.
 *
 * Permission Hierarchy:
 * - Organization: OWNER > ADMIN > MEMBER > GUEST
 * - Board: ADMIN > MEMBER > GUEST
 *
 * Usage:
 * - Inject into guards, command handlers, or controllers
 * - Call methods to check permissions before allowing operations
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardEntity } from '../../infrastructure/persistence/entities/board.entity';
import {
  BoardMemberEntity,
  BoardRole,
} from '../../infrastructure/persistence/entities/board-member.entity';
import {
  OrganizationMemberEntity,
  OrganizationRole,
} from '../../infrastructure/persistence/entities/organization-member.entity';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardMemberEntity)
    private readonly boardMemberRepository: Repository<BoardMemberEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly organizationMemberRepository: Repository<OrganizationMemberEntity>,
  ) {}

  /**
   * Check if user is a member of an organization
   */
  async isOrganizationMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const membership = await this.organizationMemberRepository.findOne({
      where: { userId, organizationId },
    });
    return !!membership;
  }

  /**
   * Check if user is a member of a board
   */
  async isBoardMember(userId: string, boardId: string): Promise<boolean> {
    const membership = await this.boardMemberRepository.findOne({
      where: { userId, boardId },
    });
    return !!membership;
  }

  /**
   * Get user's organization role
   */
  async getOrganizationRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationRole | null> {
    const membership = await this.organizationMemberRepository.findOne({
      where: { userId, organizationId },
    });
    return membership?.role || null;
  }

  /**
   * Get user's board role
   */
  async getBoardRole(
    userId: string,
    boardId: string,
  ): Promise<BoardRole | null> {
    const membership = await this.boardMemberRepository.findOne({
      where: { userId, boardId },
    });
    return membership?.role || null;
  }

  /**
   * Check if user has organization permission
   * @param requiredRole - Minimum required role (checks if user has this role or higher)
   */
  async hasOrganizationPermission(
    userId: string,
    organizationId: string,
    requiredRole: OrganizationRole,
  ): Promise<PermissionCheckResult> {
    const userRole = await this.getOrganizationRole(userId, organizationId);

    if (!userRole) {
      return {
        allowed: false,
        reason: 'User is not a member of this organization',
      };
    }

    const allowed = this.compareOrganizationRoles(userRole, requiredRole);
    return {
      allowed,
      reason: allowed
        ? undefined
        : `Insufficient permissions. Required: ${requiredRole}, Has: ${userRole}`,
    };
  }

  /**
   * Check if user has board permission
   * @param requiredRole - Minimum required role (checks if user has this role or higher)
   */
  async hasBoardPermission(
    userId: string,
    boardId: string,
    requiredRole: BoardRole,
  ): Promise<PermissionCheckResult> {
    // First check board membership
    const userRole = await this.getBoardRole(userId, boardId);

    if (!userRole) {
      return {
        allowed: false,
        reason: 'User is not a member of this board',
      };
    }

    const allowed = this.compareBoardRoles(userRole, requiredRole);
    return {
      allowed,
      reason: allowed
        ? undefined
        : `Insufficient permissions. Required: ${requiredRole}, Has: ${userRole}`,
    };
  }

  /**
   * Check if user can access board (checks both organization and board membership)
   */
  async canAccessBoard(
    userId: string,
    boardId: string,
  ): Promise<PermissionCheckResult> {
    // Get board to find organization
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      select: ['id', 'organizationId'],
    });

    if (!board) {
      return { allowed: false, reason: 'Board not found' };
    }

    // Check organization membership
    const isOrgMember = await this.isOrganizationMember(
      userId,
      board.organizationId,
    );
    if (!isOrgMember) {
      return {
        allowed: false,
        reason: 'User is not a member of the board organization',
      };
    }

    // Check board membership
    const isBoardMember = await this.isBoardMember(userId, boardId);
    if (!isBoardMember) {
      return { allowed: false, reason: 'User is not a member of this board' };
    }

    return { allowed: true };
  }

  /**
   * Check if user can write to board (must be member or admin, not guest)
   */
  async canWriteToBoard(
    userId: string,
    boardId: string,
  ): Promise<PermissionCheckResult> {
    const accessCheck = await this.canAccessBoard(userId, boardId);
    if (!accessCheck.allowed) {
      return accessCheck;
    }

    const userRole = await this.getBoardRole(userId, boardId);
    if (userRole === BoardRole.GUEST) {
      return {
        allowed: false,
        reason: 'Guest users have read-only access',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can manage board (must be admin)
   */
  async canManageBoard(
    userId: string,
    boardId: string,
  ): Promise<PermissionCheckResult> {
    return this.hasBoardPermission(userId, boardId, BoardRole.ADMIN);
  }

  /**
   * Check if user can manage organization (must be owner or admin)
   */
  async canManageOrganization(
    userId: string,
    organizationId: string,
  ): Promise<PermissionCheckResult> {
    const userRole = await this.getOrganizationRole(userId, organizationId);

    if (!userRole) {
      return {
        allowed: false,
        reason: 'User is not a member of this organization',
      };
    }

    const allowed =
      userRole === OrganizationRole.OWNER ||
      userRole === OrganizationRole.ADMIN;
    return {
      allowed,
      reason: allowed
        ? undefined
        : 'Only organization owners and admins can manage settings',
    };
  }

  /**
   * Throw exception if permission check fails
   */
  assertPermission(result: PermissionCheckResult): void {
    if (!result.allowed) {
      throw new ForbiddenException(
        result.reason || 'Permission denied: insufficient privileges',
      );
    }
  }

  /**
   * Compare organization roles (returns true if userRole >= requiredRole)
   */
  private compareOrganizationRoles(
    userRole: OrganizationRole,
    requiredRole: OrganizationRole,
  ): boolean {
    const hierarchy = {
      [OrganizationRole.OWNER]: 4,
      [OrganizationRole.ADMIN]: 3,
      [OrganizationRole.MEMBER]: 2,
      [OrganizationRole.GUEST]: 1,
    };

    return hierarchy[userRole] >= hierarchy[requiredRole];
  }

  /**
   * Compare board roles (returns true if userRole >= requiredRole)
   */
  private compareBoardRoles(
    userRole: BoardRole,
    requiredRole: BoardRole,
  ): boolean {
    const hierarchy = {
      [BoardRole.ADMIN]: 3,
      [BoardRole.MEMBER]: 2,
      [BoardRole.GUEST]: 1,
    };

    return hierarchy[userRole] >= hierarchy[requiredRole];
  }
}
