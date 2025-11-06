/**
 * Card Feature Component Prop Interfaces
 * Defines prop types for all card-related components
 */

import type { Card as CardType } from '@/services/api/card.api';
import type { Activity } from '@/services/api/activity.api';

/**
 * User type for assignee-related components
 */
export interface User {
  userId: string;
  username: string;
  email?: string;
}

/**
 * Props for the Card component
 * Displays a card with drag-and-drop functionality
 */
export interface CardProps {
  /** The card data to display */
  card: CardType & { assignees?: User[] };
  /** Callback when card is clicked */
  onClick?: () => void;
}

/**
 * Props for the CreateCardForm component
 * Form for adding a new card to a list
 */
export interface CreateCardFormProps {
  /** The ID of the list to add the card to */
  listId: string;
  /** Callback when card is successfully created */
  onSuccess?: () => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

/**
 * Props for the CardModal component
 * Modal dialog for viewing and editing card details
 */
export interface CardModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** The card to display */
  card: CardType;
  /** The ID of the list containing the card */
  listId: string;
}

/**
 * Props for the AssigneeAvatars component
 * Displays avatars of assigned users
 */
export interface AssigneeAvatarsProps {
  /** Array of assigned users */
  assignees: User[];
  /** Maximum number of avatars to show */
  maxDisplay?: number;
}

/**
 * Props for the AssigneeSelector component
 * Dropdown for selecting card assignees
 */
export interface AssigneeSelectorProps {
  /** Currently selected assignees */
  selectedAssignees: User[];
  /** Available users to assign */
  availableUsers: User[];
  /** Callback when assignees change */
  onAssigneesChange: (assignees: User[]) => void;
}

/**
 * Props for the ActivityFeed component
 * Displays activity history with infinite scroll
 */
export interface ActivityFeedProps {
  /** Type of activity feed */
  type: 'card' | 'board';
  /** ID of the card or board */
  id: string;
  /** Maximum height of the feed */
  maxHeight?: string;
  /** Callback when activities are updated */
  onActivityUpdate?: (activities: Activity[]) => void;
  /** WebSocket auth token for real-time updates */
  wsToken?: string | null;
  /** Board ID for WebSocket room subscription */
  boardId?: string;
}

/**
 * Props for the ActivityItem component
 * Displays a single activity entry
 */
export interface ActivityItemProps {
  /** The activity data to display */
  activity: Activity;
}

/**
 * Props for the CardDescription component
 * Editable card description field
 */
export interface CardDescriptionProps {
  /** The card ID */
  cardId: string;
  /** Current description text */
  description: string;
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void;
  /** Whether the field is in edit mode */
  isEditing: boolean;
  /** Callback to toggle edit mode */
  onEditingChange: (isEditing: boolean) => void;
}
