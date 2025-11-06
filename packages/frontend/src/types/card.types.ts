// Card entity types
// Based on data-model.md

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number; // For ordering cards vertically within list
  labels: Label[];
  assignees: CardAssignee[];
  dueDate?: string; // ISO 8601 timestamp
  attachments: Attachment[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID
}

export interface CreateCardDto {
  listId: string;
  title: string;
  description?: string;
  position?: number; // Auto-calculated if not provided
  dueDate?: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  dueDate?: string;
  labels?: string[]; // Array of label IDs
  assignees?: string[]; // Array of user IDs
}

export interface MoveCardDto {
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number; // New position in target list
}

export interface CardAssignee {
  userId: string;
  username: string;
  email: string;
  assignedAt: string;
}

// Label types
export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: LabelColor;
  createdAt: string;
}

export type LabelColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export interface CreateLabelDto {
  boardId: string;
  name: string;
  color: LabelColor;
}

// Attachment types
export interface Attachment {
  id: string;
  cardId: string;
  filename: string;
  url: string;
  fileSize: number; // In bytes
  mimeType: string;
  uploadedBy: string; // User ID
  uploadedAt: string;
}

// Comment types
export interface Comment {
  id: string;
  cardId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  cardId: string;
  content: string;
}
