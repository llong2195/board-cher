// Board entity types
// Based on data-model.md

import type { List } from './list.types';

export interface Board {
  id: string;
  name: string;
  description?: string;
  lists: List[];
  members: BoardMember[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  createdBy: string; // User ID
}

export interface CreateBoardDto {
  name: string;
  description?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
}

export interface BoardMember {
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}
