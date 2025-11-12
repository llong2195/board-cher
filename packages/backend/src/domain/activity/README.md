# Activity Module

**Domain**: Activity Logging  
**Aggregate Root**: Activity  
**Module Location**: `src/domain/activity/`

## Overview

The Activity module provides comprehensive audit trail and activity logging for all actions in the system. Activities track who did what, when, and to which entities (boards, cards, lists, etc.). This module supports activity feeds, notifications, and compliance requirements.

## Purpose

- Log all user actions automatically
- Provide activity feed for boards and users
- Support audit trails for compliance
- Enable undo/redo functionality (future)
- Track entity history and changes

## Components

### Domain Model (`activity.model.ts`)

```typescript
class Activity {
  id: string;
  boardId: string; // Scoping - which board this affects
  userId: string; // Actor - who performed the action
  entityType: 'board' | 'list' | 'card' | 'comment' | 'label' | 'checklist';
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'moved';
  metadata: Record<string, any>; // Changed fields, old/new values
  createdAt: Date;
}
```

**Business Rules**:

- Activity is immutable (insert-only, no updates/deletes)
- Must reference valid board and user
- Metadata stores action-specific data (e.g., old position, new position for card moves)
- Activities auto-deleted after 90 days (retention policy)

**Key Methods**:

- `static log()` - Create activity log entry
- `getDescription()` - Human-readable description ("John moved Card A to List B")

### Repository (`activity.repository.ts`)

**Key Methods**:

- `findByBoard(boardId, limit): Promise<Activity[]>`
- `findByUser(userId, limit): Promise<Activity[]>`
- `findByEntity(entityType, entityId): Promise<Activity[]>`
- `save(activity): Promise<Activity>`
- `deleteOlderThan(days): Promise<number>` - Cleanup old activities

## Data Flow

### Logging an Activity

```text
1. Domain event emitted (e.g., CardMovedEvent)
2. ActivitySubscriber listens for event
3. Create Activity via Activity.log()
4. Save to repository
5. WebSocket broadcasts to board room (for activity feed)
6. Activity appears in board's activity feed
```

### Activity Feed

```text
1. GET /boards/:id/activities
2. Load activities for board (last 100)
3. Enrich with user/entity data
4. Cache for 30 seconds
5. Return ActivityResponseDto[]
```

## Database Schema

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_activities_board_created (board_id, created_at DESC),
  INDEX idx_activities_user (user_id, created_at DESC),
  INDEX idx_activities_entity (entity_type, entity_id, created_at DESC)
);
```

**Relationships**:

- `board_id` → `boards.id` (many-to-one)
- `user_id` → `users.id` (many-to-one, nullable if user deleted)
- Polymorphic reference to any entity via (entity_type, entity_id)

## API Endpoints

| Method | Path                     | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/boards/:id/activities` | Get board activity feed      |
| GET    | `/users/me/activities`   | Get user's activity history  |
| GET    | `/cards/:id/activities`  | Get card-specific activities |

## Performance Considerations

- **Index on (board_id, created_at DESC)**: Fast activity feed queries
- **Partitioning**: Partition by month for large activity tables
- **Caching**: 30 second TTL (very high write rate)
- **Retention**: Auto-delete activities older than 90 days
- **Expected volume**: 1000-5000 activities per board per month

## Related Modules

- **All Modules** - Activity logs actions from all modules
- **User Module** - Activity references actor
- **Board Module** - Activity scoped to boards
