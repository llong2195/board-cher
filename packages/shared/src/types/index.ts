/**
 * User-related types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
}

export interface UserUpdateInput {
  name?: string;
  avatarUrl?: string | null;
}

/**
 * Board-related types
 */
export interface Board {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * List-related types
 */
export interface List {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Card-related types
 */
export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Organization-related types
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WebSocket event types
 */
export * from './websocket-events';
