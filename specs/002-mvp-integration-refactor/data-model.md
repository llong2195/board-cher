# Data Model: MVP Integration Bug Fixes & Frontend Refactoring

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the frontend data models (TypeScript interfaces) for API interactions, WebSocket events, and component props. Since this is a refactoring feature, the data model aligns with existing backend entities but adds proper TypeScript typing and validation.

**Note**: Backend data model is unchanged (out of scope). This document focuses on frontend type definitions.

---

## Core Entities

### Board

Represents a kanban board containing multiple lists.

```typescript
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
```

**Validation Rules**:

- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `id`: UUID v4 format
- Timestamps: ISO 8601 format

**State Transitions**: None (CRUD only)

---

### List

Represents a vertical list (column) on a board, containing cards.

```typescript
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
```

**Validation Rules**:

- `name`: Required, 1-50 characters
- `position`: Non-negative integer
- `boardId`: Must reference existing board

**State Transitions**:

- Position changes when lists are reordered
- Position auto-increments when new list created

---

### Card

Represents an individual task card within a list.

```typescript
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
```

**Validation Rules**:

- `title`: Required, 1-200 characters
- `description`: Optional, max 5000 characters
- `position`: Non-negative integer
- `dueDate`: ISO 8601 format, optional

**State Transitions**:

- Position changes when cards are reordered or moved between lists
- Position auto-increments when new card created

---

### Label

Represents a colored label that can be attached to cards.

```typescript
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
```

**Validation Rules**:

- `name`: Required, 1-30 characters
- `color`: Must be one of predefined colors

---

### Attachment & Comment

Supporting entities for cards.

```typescript
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
```

---

## WebSocket Event Types

### Event Payloads

```typescript
// Connection events
export interface WebSocketConnectionEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';
  timestamp: string;
}

// Board events
export interface BoardUpdatedEvent {
  type: 'board:updated';
  boardId: string;
  changes: Partial<Board>;
  updatedBy: string;
  timestamp: string;
}

export interface BoardMemberJoinedEvent {
  type: 'board:member:joined';
  boardId: string;
  member: BoardMember;
  timestamp: string;
}

// List events
export interface ListCreatedEvent {
  type: 'list:created';
  boardId: string;
  list: List;
  createdBy: string;
  timestamp: string;
}

export interface ListUpdatedEvent {
  type: 'list:updated';
  boardId: string;
  listId: string;
  changes: Partial<List>;
  updatedBy: string;
  timestamp: string;
}

export interface ListDeletedEvent {
  type: 'list:deleted';
  boardId: string;
  listId: string;
  deletedBy: string;
  timestamp: string;
}

export interface ListsReorderedEvent {
  type: 'lists:reordered';
  boardId: string;
  listIds: string[]; // New order
  reorderedBy: string;
  timestamp: string;
}

// Card events
export interface CardCreatedEvent {
  type: 'card:created';
  boardId: string;
  listId: string;
  card: Card;
  createdBy: string;
  timestamp: string;
}

export interface CardUpdatedEvent {
  type: 'card:updated';
  boardId: string;
  listId: string;
  cardId: string;
  changes: Partial<Card>;
  updatedBy: string;
  timestamp: string;
}

export interface CardMovedEvent {
  type: 'card:moved';
  boardId: string;
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
  movedBy: string;
  timestamp: string;
}

export interface CardDeletedEvent {
  type: 'card:deleted';
  boardId: string;
  listId: string;
  cardId: string;
  deletedBy: string;
  timestamp: string;
}

// Union type for all events
export type WebSocketEvent =
  | WebSocketConnectionEvent
  | BoardUpdatedEvent
  | BoardMemberJoinedEvent
  | ListCreatedEvent
  | ListUpdatedEvent
  | ListDeletedEvent
  | ListsReorderedEvent
  | CardCreatedEvent
  | CardUpdatedEvent
  | CardMovedEvent
  | CardDeletedEvent;
```

---

## API Response Types

### Standard Response Wrappers

```typescript
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, string[]>; // Validation errors
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Endpoint-Specific Responses

```typescript
// GET /boards
export type GetBoardsResponse = ApiResponse<Board[]>;

// GET /boards/:id
export type GetBoardResponse = ApiResponse<Board>;

// POST /boards
export type CreateBoardResponse = ApiResponse<Board>;

// PATCH /boards/:id
export type UpdateBoardResponse = ApiResponse<Board>;

// DELETE /boards/:id
export type DeleteBoardResponse = ApiResponse<{ success: boolean }>;

// Similar for lists and cards...
```

---

## Hook State Types

### Generic Hook Return Types

```typescript
// For query hooks (GET operations)
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// For mutation hooks (POST, PATCH, DELETE operations)
export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}
```

### Specific Hook Types

```typescript
// Example: useGetBoard hook
export type UseGetBoardResult = UseQueryResult<Board>;

// Example: useCreateCard hook
export type UseCreateCardResult = UseMutationResult<Card, CreateCardDto>;

// Example: useMoveCard hook
export type UseMoveCardResult = UseMutationResult<Card, MoveCardDto>;
```

---

## Component Prop Types

### Feature Component Props

```typescript
// BoardHeader component
export interface BoardHeaderProps {
  board: Board;
  onUpdate: (data: UpdateBoardDto) => void;
  onDelete: () => void;
  loading?: boolean;
}

// ListContainer component
export interface ListContainerProps {
  list: List;
  onUpdate: (data: UpdateListDto) => void;
  onDelete: () => void;
  onReorder: (cardIds: string[]) => void;
  onCardDrop: (cardId: string, position: number) => void;
}

// CardItem component
export interface CardItemProps {
  card: Card;
  onUpdate: (data: UpdateCardDto) => void;
  onDelete: () => void;
  onMove: (listId: string, position: number) => void;
  draggable?: boolean;
}

// CreateCardForm component
export interface CreateCardFormProps {
  listId: string;
  onSubmit: (data: CreateCardDto) => void;
  onCancel: () => void;
  loading?: boolean;
}
```

### Shared UI Component Props

```typescript
// Already defined by shadcn/ui, but custom wrappers if needed

// ConfirmDialog component
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}

// LoadingSpinner component
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}
```

---

## Error Types

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class WebSocketError extends Error {
  constructor(
    message: string,
    public reconnecting: boolean = false,
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}
```

---

## Type Guards & Utilities

```typescript
// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError';
}

// Type guard for network errors
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof Error && error.name === 'NetworkError';
}

// Type guard for validation errors
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && error.name === 'ValidationError';
}

// Extract error message utility
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (isValidationError(error)) {
    const messages = Object.values(error.errors).flat();
    return messages.join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
```

---

## Data Volume & Scale Assumptions

Based on the spec and typical kanban board usage:

- **Boards per user**: 1-20 (small scale)
- **Lists per board**: 3-10 (typical: To Do, In Progress, Done)
- **Cards per list**: 10-50 (hundreds total per board)
- **Real-time users per board**: 1-20 concurrent
- **WebSocket events**: 10-100 per minute during active collaboration

**Performance Implications**:

- No pagination needed for lists (small count)
- Virtual scrolling considered for cards if list > 100 items
- WebSocket event debouncing for rapid updates (e.g., during drag-and-drop)
- Optimistic UI updates to reduce perceived latency

---

## Summary

All entities, DTOs, event types, and hook interfaces are defined with:

- Full TypeScript type safety
- Validation rules documented
- Relationships between entities clear
- WebSocket event payloads structured
- Error types and type guards provided

This data model supports the refactoring goals:

- Type-safe API service layer
- Type-safe custom hooks
- Type-safe component props
- Consistent error handling
- Real-time update synchronization

Ready to proceed with API contracts definition.
