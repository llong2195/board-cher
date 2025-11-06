// WebSocket event types
// Based on data-model.md and contracts/websocket-events.md

// Re-export types that will be needed
import type { Board } from './board.types';
import type { List } from './list.types';
import type { Card } from './card.types';

// Connection events
export interface WebSocketConnectionEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';
  timestamp: string;
}

// Board member interface for events
export interface BoardMember {
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

// Board events
export interface BoardUpdatedEvent {
  type: 'board:updated';
  boardId: string;
  changes: Partial<Board>;
  updatedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface BoardMemberJoinedEvent {
  type: 'board:member:joined';
  boardId: string;
  user: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface BoardMemberLeftEvent {
  type: 'board:member:left';
  boardId: string;
  userId: string;
  timestamp: string;
}

// List events
export interface ListCreatedEvent {
  type: 'list:created';
  boardId: string;
  list: List;
  createdBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface ListUpdatedEvent {
  type: 'list:updated';
  boardId: string;
  listId: string;
  changes: Partial<List>;
  updatedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface ListDeletedEvent {
  type: 'list:deleted';
  boardId: string;
  listId: string;
  deletedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface ListsReorderedEvent {
  type: 'lists:reordered';
  boardId: string;
  listIds: string[]; // New order
  reorderedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

// Card events
export interface CardCreatedEvent {
  type: 'card:created';
  boardId: string;
  listId: string;
  card: Card;
  createdBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface CardUpdatedEvent {
  type: 'card:updated';
  boardId: string;
  listId: string;
  cardId: string;
  changes: Partial<Card>;
  updatedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface CardMovedEvent {
  type: 'card:moved';
  boardId: string;
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
  movedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

export interface CardDeletedEvent {
  type: 'card:deleted';
  boardId: string;
  listId: string;
  cardId: string;
  deletedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}

// Error events
export interface WebSocketErrorEvent {
  type: 'error';
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Union type for all events
export type WebSocketEvent =
  | WebSocketConnectionEvent
  | BoardUpdatedEvent
  | BoardMemberJoinedEvent
  | BoardMemberLeftEvent
  | ListCreatedEvent
  | ListUpdatedEvent
  | ListDeletedEvent
  | ListsReorderedEvent
  | CardCreatedEvent
  | CardUpdatedEvent
  | CardMovedEvent
  | CardDeletedEvent
  | WebSocketErrorEvent;

// Connection status type
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Room join/leave payloads
export interface JoinBoardPayload {
  boardId: string;
}

export interface LeaveBoardPayload {
  boardId: string;
}

export interface BoardJoinedPayload {
  boardId: string;
  activeUsers: {
    userId: string;
    username: string;
  }[];
}
