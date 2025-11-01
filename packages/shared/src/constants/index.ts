/**
 * User roles in organizations
 */
export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

/**
 * User roles in boards
 */
export enum BoardRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

/**
 * Organization role permissions
 */
export const ORGANIZATION_PERMISSIONS = {
  [OrganizationRole.OWNER]: [
    'organization:delete',
    'organization:update',
    'organization:manage-members',
    'organization:manage-boards',
    'organization:view',
  ],
  [OrganizationRole.ADMIN]: [
    'organization:update',
    'organization:manage-members',
    'organization:manage-boards',
    'organization:view',
  ],
  [OrganizationRole.MEMBER]: ['organization:view', 'organization:create-board'],
} as const;

/**
 * Board role permissions
 */
export const BOARD_PERMISSIONS = {
  [BoardRole.ADMIN]: [
    'board:delete',
    'board:update',
    'board:manage-members',
    'board:manage-lists',
    'board:manage-cards',
    'board:view',
  ],
  [BoardRole.MEMBER]: ['board:update', 'board:manage-lists', 'board:manage-cards', 'board:view'],
  [BoardRole.GUEST]: ['board:view'],
} as const;

/**
 * Check if user has permission
 */
export function hasOrganizationPermission(role: OrganizationRole, permission: string): boolean {
  return ORGANIZATION_PERMISSIONS[role]?.includes(permission as any) || false;
}

export function hasBoardPermission(role: BoardRole, permission: string): boolean {
  return BOARD_PERMISSIONS[role]?.includes(permission as any) || false;
}
