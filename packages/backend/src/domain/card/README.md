# Card Module

**Domain**: Card Management  
**Aggregate Root**: Card  
**Module Location**: `src/domain/card/`

## Overview

The Card module manages individual work items within lists. Cards represent tasks, features, bugs, or any trackable work item in a Kanban board. Cards contain details, assignments, due dates, checklists, comments, and attachments.

## Purpose

- Create, read, update, and archive cards
- Manage card metadata (title, description, due date, priority)
- Assign cards to users
- Move cards between lists and positions
- Track card labels, checklists, and attachments
- Real-time card updates via WebSocket

## Components

### Domain Model (`card.model.ts`)

```typescript
class Card {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number; // Order within list
  assignedUserId: string | null;
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**Business Rules**:

- Card title required (1-255 characters)
- Card must belong to a list
- Position must be positive integer
- Due date must be in future for new cards
- Archived cards cannot be edited

**Key Methods**:

- `static create()` - Create new card
- `update()` - Update card metadata
- `move()` - Move to different list/position
- `assign()` - Assign to user
- `archive()` - Archive card
- `validate()` - Enforce invariants

### Repository (`card.repository.ts`)

**Key Methods**:

- `findById(id): Promise<Card | null>`
- `findByList(listId): Promise<Card[]>`
- `findByAssignee(userId): Promise<Card[]>`
- `save(card): Promise<Card>`
- `delete(id): Promise<void>`
- `reorder(listId, cardIds): Promise<void>` - Bulk position update

### Permissions Helper (`card-permissions.helper.ts`)

**Key Methods**:

- `canView(userId, card): boolean`
- `canEdit(userId, card): boolean`
- `canDelete(userId, card): boolean`
- `canAssign(userId, card): boolean`

## Data Flow

### Creating a Card

```text
1. POST /cards with CreateCardDto
2. Validate card belongs to accessible list
3. Calculate position (end of list)
4. Create Card via Card.create()
5. Save to repository
6. Emit CardCreatedEvent
7. WebSocket broadcasts to board room
8. Return CardResponseDto
```

### Moving a Card

```text
1. PATCH /cards/:id/move with { listId, position }
2. Load card from repository
3. Validate target list exists and is accessible
4. Call card.move(listId, position)
5. Reorder other cards if needed
6. Save updated card
7. Emit CardMovedEvent
8. WebSocket broadcasts real-time update
9. Invalidate cache for both lists
```

## Database Schema

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  INDEX idx_cards_list (list_id),
  INDEX idx_cards_list_position (list_id, position),
  INDEX idx_cards_assigned_user (assigned_user_id),
  INDEX idx_cards_due_date (due_date)
);
```

**Relationships**:

- `list_id` → `lists.id` (many-to-one)
- `assigned_user_id` → `users.id` (many-to-one, nullable)
- One-to-many with `comments`, `checklists`, `attachments`, `card_labels`

## API Endpoints

| Method | Path                 | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | `/cards`             | List cards (filter by list/assignee) |
| GET    | `/cards/:id`         | Get card details                     |
| POST   | `/cards`             | Create new card                      |
| PATCH  | `/cards/:id`         | Update card                          |
| DELETE | `/cards/:id`         | Delete card                          |
| PATCH  | `/cards/:id/move`    | Move card to different list/position |
| POST   | `/cards/:id/assign`  | Assign card to user                  |
| POST   | `/cards/:id/archive` | Archive card                         |

## Performance Considerations

- **Index on (list_id, position)**: Fast card ordering queries
- **Index on assigned_user_id**: Efficient "my cards" queries
- **Caching**: 1 minute TTL (frequent updates)
- **Real-time**: WebSocket for instant updates on card moves
- **Expected load**: 100-500 cards per board, high mutation rate

## Related Modules

- **List Module** - Cards belong to lists
- **Comment Module** - Cards have comments
- **Checklist Module** - Cards have checklists
- **Attachment Module** - Cards have file attachments
- **Label Module** - Cards have labels (many-to-many)
- **Activity Module** - Tracks all card changes
