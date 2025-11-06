// List entity types
// Based on data-model.md

import type { Card } from './card.types';

export interface List {
  id: string;
  boardId: string;
  name: string;
  position: number; // For ordering lists horizontally
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateListDto {
  boardId: string;
  name: string;
  position?: number; // Auto-calculated if not provided
}

export interface UpdateListDto {
  name?: string;
  position?: number;
}

export interface ReorderListsDto {
  boardId: string;
  listIds: string[]; // Ordered array of list IDs
}
