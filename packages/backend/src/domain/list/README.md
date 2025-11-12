# List Module

**Domain**: List Management  
**Aggregate Root**: List  
**Module Location**: `src/domain/list/`

## Overview

The List module manages vertical columns within boards. Lists represent workflow stages (e.g., "To Do", "In Progress", "Done") and contain ordered cards. Lists provide structure for organizing work within a board.

## Purpose

- Create, read, update, and archive lists
- Manage list ordering within boards
- Control list visibility and settings
- Track cards within lists

## Components

### Domain Model (`list.model.ts`)

```typescript
class List {
  id: string;
  boardId: string;
  name: string;
  position: number; // Order within board
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- List name required (1-255 characters)
- List must belong to a board
- Position determines display order
- Archived lists hide their cards
- Cannot delete list with active cards (must archive first)

**Key Methods**:

- `static create()` - Create new list
- `update()` - Update list name
- `reorder()` - Change position in board
- `archive()` - Archive list and its cards
- `validate()` - Enforce invariants

### Repository (`list.repository.ts`)

**Key Methods**:

- `findById(id): Promise<List | null>`
- `findByBoard(boardId): Promise<List[]>` - Ordered by position
- `save(list): Promise<List>`
- `delete(id): Promise<void>`
- `reorder(boardId, listIds): Promise<void>` - Bulk reorder

## Data Flow

### Creating a List

```text
1. POST /lists with CreateListDto
2. Validate board exists and user has access
3. Calculate position (end of board)
4. Create List via List.create()
5. Save to repository
6. Emit ListCreatedEvent
7. WebSocket broadcasts to board
8. Return ListResponseDto
```

### Reordering Lists

```text
1. PATCH /boards/:id/reorder-lists with { listIds: [] }
2. Validate all list IDs belong to board
3. Update position for each list (bulk update)
4. Save all lists in transaction
5. Emit ListsReorderedEvent
6. WebSocket broadcasts board update
7. Invalidate board cache
```

## Database Schema

```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_lists_board (board_id),
  INDEX idx_lists_board_position (board_id, position),
  UNIQUE (board_id, position)
);
```

**Relationships**:

- `board_id` → `boards.id` (many-to-one)
- One-to-many with `cards`

## API Endpoints

| Method | Path                        | Description         |
| ------ | --------------------------- | ------------------- |
| GET    | `/lists`                    | Get lists for board |
| GET    | `/lists/:id`                | Get list details    |
| POST   | `/lists`                    | Create new list     |
| PATCH  | `/lists/:id`                | Update list name    |
| DELETE | `/lists/:id`                | Delete empty list   |
| PATCH  | `/boards/:id/reorder-lists` | Reorder all lists   |
| POST   | `/lists/:id/archive`        | Archive list        |

## Performance Considerations

- **Index on (board_id, position)**: Fast ordered list queries
- **Unique constraint**: Prevents position conflicts
- **Eager loading**: Load with cards to avoid N+1
- **Caching**: 2 minute TTL (moderate update frequency)
- **Expected load**: 3-10 lists per board, low mutation rate

## Related Modules

- **Board Module** - Lists belong to boards
- **Card Module** - Lists contain cards
