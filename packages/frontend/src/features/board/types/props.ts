/**
 * Board Feature Component Prop Interfaces
 * Defines prop types for all board-related components
 */

import type { OrganizationRole } from '@/services/api/organization.api';

/**
 * Props for the main Board component
 * Displays a board with lists and drag-and-drop functionality
 */
export interface BoardProps {
  /** The ID of the board to display */
  boardId: string;
  /** The user's role in the organization (affects permissions) */
  userRole?: OrganizationRole | null;
  /** Whether the user's role is currently being loaded */
  isLoadingRole?: boolean;
}
