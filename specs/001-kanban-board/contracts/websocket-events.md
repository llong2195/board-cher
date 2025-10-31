# WebSocket Events: Collaborative Kanban Board

**Feature**: 001-kanban-board  
**Date**: 2025-10-31  
**Phase**: 1 - Design & Contracts

## Connection & Authentication

### Handshake

**Client → Server**:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <JWT_ACCESS_TOKEN>',
  },
  transports: ['websocket', 'polling'],
});
```

**Server Response**:

- `connect`: Connection established
- `error`: Authentication failed or connection error

### Disconnect

**Client → Server**:

```javascript
socket.disconnect();
```

---

## Board Operations

### Join Board Room

**Client → Server**: `board:join`

```json
{
  "boardId": "uuid"
}
```

**Server → Client**: `board:joined`

```json
{
  "boardId": "uuid",
  "members": [
    {
      "userId": "uuid",
      "name": "Alice Johnson",
      "avatarUrl": "https://...",
      "role": "admin"
    }
  ]
}
```

**Error Response**: `board:join:error`

```json
{
  "message": "Board not found or access denied",
  "code": "BOARD_ACCESS_DENIED"
}
```

---

### Leave Board Room

**Client → Server**: `board:leave`

```json
{
  "boardId": "uuid"
}
```

**Server → All Clients in Room**: `board:member:left`

```json
{
  "boardId": "uuid",
  "userId": "uuid"
}
```

---

### Board Updated

**Server → All Clients in Room**: `board:updated`

```json
{
  "boardId": "uuid",
  "name": "Updated Board Name",
  "description": "Updated description",
  "color": "#3b82f6",
  "updatedBy": "uuid",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

## List Operations

### List Created

**Server → All Clients in Room**: `list:created`

```json
{
  "list": {
    "id": "uuid",
    "boardId": "uuid",
    "name": "New List",
    "position": 2,
    "createdBy": "uuid",
    "createdAt": "2025-10-31T12:00:00Z"
  }
}
```

---

### List Updated

**Server → All Clients in Room**: `list:updated`

```json
{
  "list": {
    "id": "uuid",
    "name": "Updated List Name",
    "position": 2,
    "updatedBy": "uuid",
    "updatedAt": "2025-10-31T12:00:00Z"
  }
}
```

---

### List Moved

**Server → All Clients in Room**: `list:moved`

```json
{
  "listId": "uuid",
  "oldPosition": 1,
  "newPosition": 3,
  "movedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### List Deleted

**Server → All Clients in Room**: `list:deleted`

```json
{
  "listId": "uuid",
  "deletedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## Card Operations

### Card Created

**Server → All Clients in Room**: `card:created`

```json
{
  "card": {
    "id": "uuid",
    "listId": "uuid",
    "title": "New Card",
    "description": null,
    "position": 5,
    "dueDate": null,
    "createdBy": "uuid",
    "createdAt": "2025-10-31T12:00:00Z",
    "labels": [],
    "assignees": []
  }
}
```

---

### Card Updated

**Server → All Clients in Room**: `card:updated`

```json
{
  "card": {
    "id": "uuid",
    "title": "Updated Card Title",
    "description": "Updated description",
    "dueDate": "2025-11-15T00:00:00Z",
    "updatedBy": "uuid",
    "updatedAt": "2025-10-31T12:00:00Z"
  }
}
```

---

### Card Moved

**Server → All Clients in Room**: `card:moved`

```json
{
  "cardId": "uuid",
  "sourceListId": "uuid",
  "targetListId": "uuid",
  "oldPosition": 2,
  "newPosition": 0,
  "movedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

**Note**: Moving within same list updates position only. Moving between lists updates both listId and position.

---

### Card Deleted

**Server → All Clients in Room**: `card:deleted`

```json
{
  "cardId": "uuid",
  "listId": "uuid",
  "deletedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## Card Detail Operations

### Comment Added

**Server → All Clients in Room**: `card:comment:added`

```json
{
  "comment": {
    "id": "uuid",
    "cardId": "uuid",
    "userId": "uuid",
    "userName": "Bob Smith",
    "userAvatar": "https://...",
    "content": "This looks great!",
    "createdAt": "2025-10-31T12:00:00Z"
  }
}
```

---

### Comment Updated

**Server → All Clients in Room**: `card:comment:updated`

```json
{
  "comment": {
    "id": "uuid",
    "cardId": "uuid",
    "content": "This looks even better!",
    "isEdited": true,
    "updatedAt": "2025-10-31T12:05:00Z"
  }
}
```

---

### Comment Deleted

**Server → All Clients in Room**: `card:comment:deleted`

```json
{
  "commentId": "uuid",
  "cardId": "uuid",
  "deletedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### Attachment Added

**Server → All Clients in Room**: `card:attachment:added`

```json
{
  "attachment": {
    "id": "uuid",
    "cardId": "uuid",
    "filename": "design-mockup.png",
    "mimeType": "image/png",
    "fileSize": 245760,
    "uploadedBy": "uuid",
    "uploadedAt": "2025-10-31T12:00:00Z",
    "downloadUrl": "/api/attachments/uuid/download"
  }
}
```

---

### Label Applied

**Server → All Clients in Room**: `card:label:applied`

```json
{
  "cardId": "uuid",
  "label": {
    "id": "uuid",
    "name": "Bug",
    "color": "#ef4444"
  },
  "appliedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### Label Removed

**Server → All Clients in Room**: `card:label:removed`

```json
{
  "cardId": "uuid",
  "labelId": "uuid",
  "removedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### User Assigned

**Server → All Clients in Room**: `card:assigned`

```json
{
  "cardId": "uuid",
  "assignee": {
    "userId": "uuid",
    "name": "Carol White",
    "avatarUrl": "https://..."
  },
  "assignedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### User Unassigned

**Server → All Clients in Room**: `card:unassigned`

```json
{
  "cardId": "uuid",
  "userId": "uuid",
  "unassignedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

### Checklist Item Toggled

**Server → All Clients in Room**: `card:checklist:item:toggled`

```json
{
  "cardId": "uuid",
  "checklistId": "uuid",
  "itemId": "uuid",
  "isCompleted": true,
  "completedBy": "uuid",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## Presence & Typing Indicators

### User Typing (Optional Feature)

**Client → Server**: `card:typing:start`

```json
{
  "cardId": "uuid"
}
```

**Server → Other Clients in Room**: `card:typing:user`

```json
{
  "cardId": "uuid",
  "userId": "uuid",
  "userName": "Alice Johnson"
}
```

**Client → Server**: `card:typing:stop`

```json
{
  "cardId": "uuid"
}
```

---

## Error Handling

### General Error

**Server → Client**: `error`

```json
{
  "event": "card:moved",
  "message": "Card not found",
  "code": "CARD_NOT_FOUND",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

### Rate Limit Exceeded

**Server → Client**: `rate_limit_exceeded`

```json
{
  "message": "Too many events sent. Please slow down.",
  "retryAfter": 60,
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## Connection Management

### Heartbeat

**Server → Client** (every 30s): `ping`
**Client → Server**: `pong`

**If no pong received within 60s**: Server disconnects client

---

## Event Acknowledgements

All client-initiated events that modify data should use acknowledgements:

```javascript
socket.emit('card:create', { listId, title }, (response) => {
  if (response.success) {
    console.log('Card created:', response.card);
  } else {
    console.error('Error:', response.error);
  }
});
```

**Success Response**:

```json
{
  "success": true,
  "card": {
    /* card object */
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "message": "Permission denied",
    "code": "PERMISSION_DENIED"
  }
}
```

---

## Event Ordering & Conflict Resolution

### Optimistic Updates

1. Client makes change locally (optimistic)
2. Client sends event to server
3. Server validates, processes, broadcasts
4. Client receives confirmation or rollback

### Conflict Resolution

**Strategy**: Last Write Wins (LWW)

- Server uses timestamp to resolve conflicts
- Activity log preserves all changes
- Clients notified of conflicts via activity updates

---

## Rate Limiting

**Per Connection**:

- 100 events per minute
- 10 board joins per minute
- Exceeded limit triggers `rate_limit_exceeded` event

---

## Room Management

- Each board is a Socket.io room: `board:${boardId}`
- Users auto-join room on `board:join`
- Users auto-leave room on `board:leave` or disconnect
- Server broadcasts to room: `io.to('board:uuid').emit('event', data)`

---

## Implementation Notes

### Backend

```typescript
// Socket.io Gateway (NestJS)
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
})
export class BoardGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('board:join')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() { boardId }: JoinBoardDto,
  ): Promise<WsResponse<any>> {
    // Verify user has access to board
    // Add client to room
    client.join(`board:${boardId}`);
    // Return current board members
  }
}
```

### Frontend

```typescript
// Socket service (React)
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket;

  connect(token: string) {
    this.socket = io(API_URL, {
      auth: { token: `Bearer ${token}` },
    });

    this.socket.on('connect', () => {
      console.log('Connected');
    });

    this.socket.on('card:created', (data) => {
      // Update UI
    });
  }

  joinBoard(boardId: string) {
    this.socket.emit('board:join', { boardId });
  }
}
```

---

## Testing WebSocket Events

### Manual Testing with Socket.io Client

```bash
npm install -g socket.io-client-cli

# Connect
socket-io-client-cli connect http://localhost:3000 --auth-token "Bearer <JWT>"

# Join board
socket-io-client-cli emit board:join '{"boardId":"uuid"}'

# Listen for events
socket-io-client-cli on card:created
```

### Automated Testing

```typescript
// Integration test
import { io, Socket } from 'socket.io-client';

describe('BoardGateway', () => {
  let socket: Socket;

  beforeEach(async () => {
    socket = io('http://localhost:3000', {
      auth: { token: `Bearer ${testToken}` },
    });
    await waitForConnection(socket);
  });

  it('should broadcast card creation to all board members', (done) => {
    socket.emit('board:join', { boardId: testBoardId });

    socket.on('card:created', (data) => {
      expect(data.card.title).toBe('Test Card');
      done();
    });

    // Trigger card creation via REST API or another socket
  });
});
```

---

## Security Considerations

1. **Authentication**: Verify JWT on handshake and reconnection
2. **Authorization**: Check board access before joining room
3. **Rate Limiting**: Prevent event flooding
4. **Input Validation**: Validate all event payloads
5. **XSS Protection**: Sanitize user-generated content in comments/descriptions
6. **Denial of Service**: Limit room sizes, disconnect idle clients

---

## Performance Optimizations

1. **Event Batching**: Combine multiple rapid events (e.g., position updates) into single broadcast
2. **Selective Broadcasting**: Only send events to clients in the affected board room
3. **Compression**: Enable WebSocket compression for large payloads
4. **Connection Pooling**: Redis adapter for multi-instance scaling
5. **Backpressure Handling**: Queue events if client can't keep up
