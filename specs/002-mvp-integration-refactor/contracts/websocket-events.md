# WebSocket Events Contract

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Purpose**: Define all WebSocket events for real-time board synchronization

## Overview

This document specifies the contract for WebSocket communication between the frontend and backend. It defines event names, payload structures, and expected behaviors for real-time updates.

**Transport**: Socket.io 4.8.1  
**Namespace**: `/boards` (default namespace)  
**Authentication**: JWT token sent in connection handshake

---

## Connection Management

### Client → Server: Connection Initialization

**Event**: `connection`  
**Automatic**: Socket.io handles this  
**Payload**: None (JWT in auth header)

**Client Code**:

```typescript
const socket = io(WEBSOCKET_URL, {
  auth: {
    token: getAuthToken(),
  },
  transports: ['websocket', 'polling'], // Fallback to polling
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

---

### Server → Client: Connection Events

**Event**: `connect`  
**When**: Successfully connected to server  
**Payload**: None

**Client Handler**:

```typescript
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  setConnectionStatus('connected');
  toast.success('Connected');
});
```

---

**Event**: `disconnect`  
**When**: Connection lost (network issue, server restart)  
**Payload**: `{ reason: string }`

**Client Handler**:

```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  setConnectionStatus('disconnected');
  // Don't show toast immediately (might be temporary)
});
```

---

**Event**: `reconnecting`  
**When**: Client attempting to reconnect  
**Payload**: `{ attempt: number }`

**Client Handler**:

```typescript
socket.on('reconnecting', (attempt) => {
  console.log('Reconnecting...', attempt);
  setConnectionStatus('reconnecting');
  if (attempt === 1) {
    toast.info('Reconnecting...', { duration: null }); // Persistent toast
  }
});
```

---

**Event**: `reconnect`  
**When**: Successfully reconnected after disconnection  
**Payload**: `{ attempt: number }`

**Client Handler**:

```typescript
socket.on('reconnect', (attempt) => {
  console.log('Reconnected after', attempt, 'attempts');
  setConnectionStatus('connected');
  toast.success('Reconnected');
  // Refetch board data to ensure sync
  refetchBoard();
});
```

---

**Event**: `connect_error`  
**When**: Connection attempt failed (auth error, server down)  
**Payload**: `Error`

**Client Handler**:

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  if (error.message.includes('auth')) {
    // Authentication failed - redirect to login
    redirectToLogin();
  }
});
```

---

## Room Management

### Client → Server: Join Board Room

**Event**: `board:join`  
**When**: User navigates to a board page  
**Payload**:

```typescript
{
  boardId: string;
}
```

**Client Code**:

```typescript
socket.emit('board:join', { boardId: 'board-123' });
```

**Server Response**: Confirms join via `board:joined` event

---

**Event**: `board:joined`  
**When**: Server confirms user joined board room  
**Payload**:

```typescript
{
  boardId: string;
  activeUsers: {
    userId: string;
    username: string;
  }
  [];
}
```

**Client Handler**:

```typescript
socket.on('board:joined', ({ boardId, activeUsers }) => {
  console.log('Joined board', boardId, 'with', activeUsers.length, 'users');
  setActiveUsers(activeUsers);
});
```

---

### Client → Server: Leave Board Room

**Event**: `board:leave`  
**When**: User navigates away from board page  
**Payload**:

```typescript
{
  boardId: string;
}
```

**Client Code**:

```typescript
useEffect(() => {
  socket.emit('board:join', { boardId });

  return () => {
    socket.emit('board:leave', { boardId });
  };
}, [boardId]);
```

---

## Board Events

### Server → Client: Board Updated

**Event**: `board:updated`  
**When**: Board name or description changed by another user  
**Payload**:

```typescript
{
  boardId: string;
  changes: Partial<Board>;
  updatedBy: {
    userId: string;
    username: string;
  }
  timestamp: string; // ISO 8601
}
```

**Client Handler**:

```typescript
socket.on('board:updated', ({ boardId, changes, updatedBy }) => {
  // Update local board state
  updateBoard((prev) => ({ ...prev, ...changes }));

  // Show notification (optional)
  if (updatedBy.userId !== currentUserId) {
    toast.info(`${updatedBy.username} updated the board`);
  }
});
```

---

### Server → Client: Board Member Joined

**Event**: `board:member:joined`  
**When**: New user joins the board (opens the page)  
**Payload**:

```typescript
{
  boardId: string;
  user: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('board:member:joined', ({ user }) => {
  addActiveUser(user);
  // Optional: Show "User X joined" notification
});
```

---

### Server → Client: Board Member Left

**Event**: `board:member:left`  
**When**: User leaves the board (navigates away or disconnects)  
**Payload**:

```typescript
{
  boardId: string;
  userId: string;
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('board:member:left', ({ userId }) => {
  removeActiveUser(userId);
});
```

---

## List Events

### Server → Client: List Created

**Event**: `list:created`  
**When**: New list added to board by another user  
**Payload**:

```typescript
{
  boardId: string;
  list: List;
  createdBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('list:created', ({ list, createdBy }) => {
  if (createdBy.userId === currentUserId) return; // Skip own changes

  // Add list to board
  addList(list);

  // Optional notification
  toast.info(`${createdBy.username} created list "${list.name}"`);
});
```

---

### Server → Client: List Updated

**Event**: `list:updated`  
**When**: List renamed or modified by another user  
**Payload**:

```typescript
{
  boardId: string;
  listId: string;
  changes: Partial<List>;
  updatedBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('list:updated', ({ listId, changes, updatedBy }) => {
  if (updatedBy.userId === currentUserId) return;

  updateList(listId, changes);
});
```

---

### Server → Client: List Deleted

**Event**: `list:deleted`  
**When**: List removed from board by another user  
**Payload**:

```typescript
{
  boardId: string;
  listId: string;
  deletedBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('list:deleted', ({ listId, deletedBy }) => {
  if (deletedBy.userId === currentUserId) return;

  removeList(listId);
  toast.info(`${deletedBy.username} deleted a list`);
});
```

---

### Server → Client: Lists Reordered

**Event**: `lists:reordered`  
**When**: Lists dragged to new positions by another user  
**Payload**:

```typescript
{
  boardId: string;
  listIds: string[]; // Ordered array of list IDs
  reorderedBy: {
    userId: string;
    username: string;
  };
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('lists:reordered', ({ listIds, reorderedBy }) => {
  if (reorderedBy.userId === currentUserId) return;

  reorderLists(listIds); // Update positions in UI
});
```

---

## Card Events

### Server → Client: Card Created

**Event**: `card:created`  
**When**: New card added to list by another user  
**Payload**:

```typescript
{
  boardId: string;
  listId: string;
  card: Card;
  createdBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('card:created', ({ listId, card, createdBy }) => {
  if (createdBy.userId === currentUserId) return;

  addCard(listId, card);
  // Silent operation (no toast for every card creation)
});
```

---

### Server → Client: Card Updated

**Event**: `card:updated`  
**When**: Card title, description, labels, etc. changed by another user  
**Payload**:

```typescript
{
  boardId: string;
  listId: string;
  cardId: string;
  changes: Partial<Card>;
  updatedBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('card:updated', ({ cardId, changes, updatedBy }) => {
  if (updatedBy.userId === currentUserId) return;

  updateCard(cardId, changes);
  // Silent operation (no toast for minor updates)
});
```

---

### Server → Client: Card Moved

**Event**: `card:moved`  
**When**: Card dragged between lists or reordered by another user  
**Payload**:

```typescript
{
  boardId: string;
  cardId: string;
  sourceListId: string;
  targetListId: string;
  position: number;
  movedBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('card:moved', ({ cardId, sourceListId, targetListId, position, movedBy }) => {
  if (movedBy.userId === currentUserId) return;

  // Move card in UI
  moveCard(cardId, sourceListId, targetListId, position);

  // High-frequency event - no toast
});
```

---

### Server → Client: Card Deleted

**Event**: `card:deleted`  
**When**: Card removed by another user  
**Payload**:

```typescript
{
  boardId: string;
  listId: string;
  cardId: string;
  deletedBy: {
    userId: string;
    username: string;
  }
  timestamp: string;
}
```

**Client Handler**:

```typescript
socket.on('card:deleted', ({ cardId, deletedBy }) => {
  if (deletedBy.userId === currentUserId) return;

  removeCard(cardId);
  // Silent operation
});
```

---

## Error Events

### Server → Client: Error Notification

**Event**: `error`  
**When**: Operation failed on server (permission denied, validation error)  
**Payload**:

```typescript
{
  message: string;
  code: string; // 'PERMISSION_DENIED', 'VALIDATION_ERROR', etc.
  details?: Record<string, any>;
}
```

**Client Handler**:

```typescript
socket.on('error', ({ message, code }) => {
  console.error('WebSocket error:', code, message);

  toast.error({
    title: 'Operation failed',
    description: message,
  });
});
```

---

## Event Deduplication

To prevent duplicate updates when user performs action that triggers both optimistic update AND WebSocket event:

**Strategy**: Check `updatedBy.userId` and skip if it matches current user

**Example**:

```typescript
socket.on('card:created', ({ card, createdBy }) => {
  // Skip if this is our own action (already updated optimistically)
  if (createdBy.userId === currentUserId) {
    return;
  }

  // Apply update from another user
  addCard(card);
});
```

---

## Reconnection Sync Strategy

When reconnecting after disconnection, ensure data consistency:

**Strategy**: Refetch board data after successful reconnection

**Implementation**:

```typescript
socket.on('reconnect', () => {
  setConnectionStatus('connected');
  toast.success('Reconnected');

  // Refetch to ensure sync
  refetchBoard();
});
```

**Alternative**: Server could send "full sync" event with all current state

---

## Event Ordering Guarantees

Socket.io guarantees:

- ✅ Events arrive in order within same connection
- ✅ Events are acknowledged (QoS)
- ❌ No guarantee across different users

**Conflict Resolution**: Last write wins (handled by backend)

---

## Testing Contract

Mock Socket.io for testing:

**Setup**:

```typescript
import { io } from 'socket.io-client';

jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
  };
});
```

**Test Pattern**:

```typescript
test('handles card:created event', () => {
  const { getByText } = render(<BoardPage />);

  // Simulate WebSocket event
  const mockOn = socket.on as jest.Mock;
  const cardCreatedHandler = mockOn.mock.calls.find(
    call => call[0] === 'card:created'
  )[1];

  // Trigger event
  cardCreatedHandler({
    card: { id: '123', title: 'New Card' },
    createdBy: { userId: 'other-user', username: 'Alice' }
  });

  // Verify UI updated
  expect(getByText('New Card')).toBeInTheDocument();
});
```

---

## Summary

This contract defines:

- ✅ All WebSocket events (connection, board, list, card)
- ✅ Payload structures with TypeScript types
- ✅ Client-side handlers for each event
- ✅ Room management (join/leave board)
- ✅ Deduplication strategy (skip own events)
- ✅ Reconnection sync strategy (refetch on reconnect)
- ✅ Error handling
- ✅ Testing patterns

All WebSocket communication must follow this contract for consistent real-time synchronization.
