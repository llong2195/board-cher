/**
 * Board Permissions Helper (T061 - Board permissions unit test)
 * User Story 1 & 4: Board Access Control and Role-Based Permissions
 *
 * Stateless helper service for checking board permissions based on roles.
 * This is a pure domain service that doesn't depend on database or infrastructure.
 *
 * Role Hierarchy (Board level):
 * - ADMIN: Full control (manage board, members, content)
 * - MEMBER: Read/write content (cards, lists, comments)
 * - GUEST: Read-only access
 *
 * Note: Board 'owner' concept comes from Organization ownership.
 * At board level, only admin/member/guest roles exist.
 */

export type BoardRole = 'owner' | 'admin' | 'member' | 'guest';

export class BoardPermissionsService {
  // Read permissions - all roles can read
  canReadBoard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member', 'guest'].includes(normalizedRole);
  }

  canReadList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member', 'guest'].includes(normalizedRole);
  }

  canReadCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member', 'guest'].includes(normalizedRole);
  }

  canReadComment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member', 'guest'].includes(normalizedRole);
  }

  canReadAttachment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member', 'guest'].includes(normalizedRole);
  }

  // Board management permissions - only owner and admin
  canUpdateBoard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  canDeleteBoard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'owner'; // Only owner can delete board
  }

  canArchiveBoard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  // Member management permissions - owner and admin
  canAddMember(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  canRemoveMember(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  canChangeMemberRole(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  // List permissions - owner, admin, member (not guest)
  canCreateList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canUpdateList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canDeleteList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canMoveList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canArchiveList(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Card permissions - owner, admin, member (not guest)
  canCreateCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canUpdateCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canDeleteCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canMoveCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canArchiveCard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Comment permissions - owner, admin, member (not guest)
  canAddComment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canEditComment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canDeleteComment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Attachment permissions - owner, admin, member (not guest)
  canAddAttachment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canDeleteAttachment(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Label permissions - owner, admin, member (not guest)
  canCreateLabel(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canApplyLabel(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canRemoveLabel(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Assignment permissions - owner, admin, member (not guest)
  canAssignMember(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  canUnassignMember(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Checklist permissions - owner, admin, member (not guest)
  canManageChecklist(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  // Higher-level permission checks
  canContribute(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin', 'member'].includes(normalizedRole);
  }

  isReadOnly(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'guest';
  }

  canManageBoard(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  canManageMembers(role: BoardRole): boolean {
    this.validateRole(role);
    const normalizedRole = role.toLowerCase();
    return ['owner', 'admin'].includes(normalizedRole);
  }

  // Helper methods
  private validateRole(role: BoardRole): void {
    if (!role || typeof role !== 'string') {
      throw new Error('Role is required');
    }

    const validRoles: BoardRole[] = ['owner', 'admin', 'member', 'guest'];
    const normalizedRole = role.toLowerCase() as BoardRole;

    if (!validRoles.includes(normalizedRole)) {
      throw new Error(
        `Invalid board role: ${role}. Must be one of: ${validRoles.join(', ')}`,
      );
    }
  }

  getRoleHierarchyLevel(role: BoardRole): number {
    this.validateRole(role);
    const hierarchy: Record<BoardRole, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      guest: 1,
    };
    return hierarchy[role.toLowerCase() as BoardRole] || 0;
  }

  hasHigherOrEqualRole(userRole: BoardRole, requiredRole: BoardRole): boolean {
    return (
      this.getRoleHierarchyLevel(userRole) >=
      this.getRoleHierarchyLevel(requiredRole)
    );
  }

  // Additional helper methods expected by tests
  isOwner(role: BoardRole): boolean {
    this.validateRole(role);
    return role.toLowerCase() === 'owner';
  }

  isAdminOrHigher(role: BoardRole): boolean {
    this.validateRole(role);
    return ['owner', 'admin'].includes(role.toLowerCase());
  }

  isMemberOrHigher(role: BoardRole): boolean {
    this.validateRole(role);
    return ['owner', 'admin', 'member'].includes(role.toLowerCase());
  }

  canWrite(role: BoardRole): boolean {
    this.validateRole(role);
    return this.canContribute(role);
  }

  canRead(role: BoardRole): boolean {
    this.validateRole(role);
    return this.canReadBoard(role);
  }

  getPermissionsForRole(role: BoardRole): {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    canDeleteBoard: boolean;
  } {
    this.validateRole(role);
    return {
      canRead: this.canReadBoard(role),
      canWrite: this.canContribute(role),
      canDelete: this.canDeleteCard(role),
      canManageMembers: this.canManageMembers(role),
      canDeleteBoard: this.canDeleteBoard(role),
    };
  }

  enforcePermission(role: BoardRole, action: string): boolean {
    this.validateRole(role);
    const methodMap: Record<string, (role: BoardRole) => boolean> = {
      'read:board': this.canReadBoard.bind(this),
      'update:board': this.canUpdateBoard.bind(this),
      'delete:board': this.canDeleteBoard.bind(this),
      'create:list': this.canCreateList.bind(this),
      'create:card': this.canCreateCard.bind(this),
      'update:card': this.canUpdateCard.bind(this),
      'delete:card': this.canDeleteCard.bind(this),
      'move:card': this.canMoveCard.bind(this),
      'add:member': this.canAddMember.bind(this),
      createCard: this.canCreateCard.bind(this),
      deleteCard: this.canDeleteCard.bind(this),
      updateBoard: this.canUpdateBoard.bind(this),
      deleteBoard: this.canDeleteBoard.bind(this),
      addMember: this.canAddMember.bind(this),
    };

    const checker = methodMap[action];
    if (!checker) {
      throw new Error(`Unknown action: ${action}`);
    }

    return checker(role);
  }

  enforcePermissionStrict(role: BoardRole, action: string): void {
    if (!this.enforcePermission(role, action)) {
      throw new Error(`Permission denied: ${role} cannot perform ${action}`);
    }
  }

  getRoleHierarchy(): BoardRole[] {
    return ['owner', 'admin', 'member', 'guest'];
  }

  isRoleHigherThan(role1: BoardRole, role2: BoardRole): boolean {
    this.validateRole(role1);
    this.validateRole(role2);
    return (
      this.getRoleHierarchyLevel(role1) > this.getRoleHierarchyLevel(role2)
    );
  }

  getRoleLevel(role: BoardRole): number {
    return this.getRoleHierarchyLevel(role);
  }

  canRemoveSpecificMember(
    userRole: BoardRole,
    targetMemberRole: BoardRole,
  ): boolean {
    this.validateRole(userRole);
    this.validateRole(targetMemberRole);

    // Only owner and admin can remove members
    if (!this.canRemoveMember(userRole)) {
      return false;
    }

    // Cannot remove someone with higher or equal role
    return this.isRoleHigherThan(userRole, targetMemberRole);
  }

  canChangeRoleToLevel(
    userRole: BoardRole,
    currentTargetRole: BoardRole,
    newTargetRole: BoardRole,
  ): boolean {
    this.validateRole(userRole);
    this.validateRole(currentTargetRole);
    this.validateRole(newTargetRole);

    // Must be able to change member roles
    if (!this.canChangeMemberRole(userRole)) {
      return false;
    }

    // Cannot change role of someone with higher or equal role
    const userLevel = this.getRoleHierarchyLevel(userRole);
    const currentTargetLevel = this.getRoleHierarchyLevel(currentTargetRole);
    const newTargetLevel = this.getRoleHierarchyLevel(newTargetRole);

    // Cannot modify someone at or above your level
    if (currentTargetLevel >= userLevel) {
      return false;
    }

    // Cannot promote to above your level (but can promote to your level if you're admin+)
    if (newTargetLevel > userLevel) {
      return false;
    }

    return true;
  }

  hasAnyBoardPermission(role: BoardRole): boolean {
    this.validateRole(role);
    return true; // All roles have at least read permission
  }
}
