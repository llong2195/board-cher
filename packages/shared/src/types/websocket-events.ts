// WebSocket event types for real-time collaboration
// Used by both frontend and backend for type-safe WebSocket communication

import { WS_EVENTS } from '../constants';

// Actor information included in all broadcast events
export interface EventActor {
  userId: string;
  name?: string;
  email?: string;
}

// Base event structure
export interface BaseEvent {
  boardId: string;
  timestamp: number;
  actor: EventActor;
}

// ============================================================================
// Board Events
// ============================================================================

export interface BoardJoinEvent {
  boardId: string;
}

export interface BoardJoinResponse {
  success: boolean;
  boardId?: string;
  activeMembers?: string[];
  error?: string;
}

export interface BoardLeaveEvent {
  boardId: string;
}

export interface BoardUserJoinedEvent extends BaseEvent {
  userId: string;
}

export interface BoardUserLeftEvent extends BaseEvent {
  userId: string;
}

export interface BoardUpdatedEvent extends BaseEvent {
  name?: string;
  description?: string;
  color?: string;
}

// ============================================================================
// List Events
// ============================================================================

export interface ListCreateEvent {
  boardId: string;
  id: string;
  name: string;
  position: number;
}

export interface ListCreatedEvent extends BaseEvent {
  id: string;
  name: string;
  position: number;
}

export interface ListMoveEvent {
  boardId: string;
  listId: string;
  position: number;
}

export interface ListMovedEvent extends BaseEvent {
  listId: string;
  position: number;
  affectedLists?: Array<{ id: string; position: number }>;
}

export interface ListUpdateEvent {
  boardId: string;
  listId: string;
  name?: string;
}

export interface ListUpdatedEvent extends BaseEvent {
  listId: string;
  name?: string;
}

export interface ListDeleteEvent {
  boardId: string;
  listId: string;
}

export interface ListDeletedEvent extends BaseEvent {
  listId: string;
}

// ============================================================================
// Card Events
// ============================================================================

export interface CardCreateEvent {
  boardId: string;
  listId: string;
  id: string;
  title: string;
  description?: string;
  position?: number;
}

export interface CardCreatedEvent extends BaseEvent {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
}

export interface CardMoveEvent {
  boardId: string;
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
}

export interface CardMovedEvent extends BaseEvent {
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
  affectedCards?: Array<{ id: string; listId: string; position: number }>;
}

export interface CardUpdateEvent {
  boardId: string;
  cardId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
}

export interface CardUpdatedEvent extends BaseEvent {
  cardId: string;
  updateNumber?: number;
  title?: string;
  description?: string;
  dueDate?: string | null;
}

export interface CardDeleteEvent {
  boardId: string;
  cardId: string;
}

export interface CardDeletedEvent extends BaseEvent {
  cardId: string;
}

// ============================================================================
// Comment Events
// ============================================================================

export interface CommentAddedEvent extends BaseEvent {
  cardId: string;
  commentId: string;
  content: string;
}

export interface CommentUpdatedEvent extends BaseEvent {
  cardId: string;
  commentId: string;
  content: string;
}

export interface CommentDeletedEvent extends BaseEvent {
  cardId: string;
  commentId: string;
}

// ============================================================================
// Attachment Events
// ============================================================================

export interface AttachmentAddedEvent extends BaseEvent {
  cardId: string;
  attachmentId: string;
  filename: string;
  size: number;
}

export interface AttachmentDeletedEvent extends BaseEvent {
  cardId: string;
  attachmentId: string;
}

// ============================================================================
// Label Events
// ============================================================================

export interface LabelAppliedEvent extends BaseEvent {
  cardId: string;
  labelId: string;
  labelName: string;
  labelColor: string;
}

export interface LabelRemovedEvent extends BaseEvent {
  cardId: string;
  labelId: string;
}

export interface LabelCreatedEvent extends BaseEvent {
  labelId: string;
  labelName: string;
  labelColor: string;
}

// ============================================================================
// Assignment Events
// ============================================================================

export interface CardAssignedEvent extends BaseEvent {
  cardId: string;
  assigneeId: string;
  assigneeName?: string;
}

export interface CardUnassignedEvent extends BaseEvent {
  cardId: string;
  assigneeId: string;
}

// ============================================================================
// Checklist Events
// ============================================================================

export interface ChecklistCreatedEvent extends BaseEvent {
  cardId: string;
  checklistId: string;
  title: string;
}

export interface ChecklistUpdatedEvent extends BaseEvent {
  cardId: string;
  checklistId: string;
  completionPercentage: number;
}

export interface ChecklistItemToggledEvent extends BaseEvent {
  cardId: string;
  checklistId: string;
  itemId: string;
  isCompleted: boolean;
}

// ============================================================================
// Event Names (constants for type-safe event emission)
// ============================================================================

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
