/**
 * List Feature Component Prop Interfaces
 * Defines prop types for all list-related components
 */

/**
 * Props for the List component
 * Displays a list with cards and handles card drops
 */
export interface ListProps {
  /** The ID of the list */
  listId: string;
  /** The name of the list */
  name: string;
  /** The position of the list on the board */
  position: number;
  /** Callback when a card is added */
  onAddCard?: () => void;
  /** Whether the user can edit the list */
  canEdit?: boolean;
}

/**
 * Props for the CreateListForm component
 * Form for adding a new list to the board
 */
export interface CreateListFormProps {
  /** The ID of the board to add the list to */
  boardId: string;
  /** Callback when list is successfully created */
  onSuccess?: () => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}
