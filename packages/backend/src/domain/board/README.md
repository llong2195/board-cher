# Board Module

**Domain**: Board Management  
**Aggregate Root**: Board  
**Module Location**: `src/domain/board/`

## Overview

The Board module manages project workspaces (boards) that contain lists and cards. A board represents a Kanban-style project workspace where teams organize and track work. Boards are the top-level organizational unit in the system.

## Purpose

- Create, read, update, and archive boards
- Manage board metadata (name, description, color, visibility)
- Control board access and permissions (owner, members, guests)
- Track board activity and changes
- Integrate with organization multi-tenancy

## Components

### Domain Model

**File**: `board.model.ts`

The `Board` class is the aggregate root containing business logic:

```typescript
class Board {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**Business Rules**:

- Board name is required and must be 1-255 characters
- Board must belong to an organization
- Archived boards are read-only (cannot add lists/cards)
- Only board owner can archive or delete board
- Board color must be valid hex code if provided

**Key Methods**:

- `static create()` - Factory method for new boards
- `update()` - Update board name, description, color
- `archive()` - Archive board (soft delete)
- `restore()` - Restore archived board
- `validate()` - Enforce business invariants

### Aggregate

**File**: `board-aggregate.ts`

The `BoardAggregate` extends the domain model with repository operations and event publishing:

```typescript
class BoardAggregate extends Board {
  // Aggregate operations
  async save(): Promise<void>;
  async delete(): Promise<void>;

  // Events
  emit(event: DomainEvent): void;
}
```

### Repository

**Files**:

- `board.repository.ts` - Repository interface
- `board-aggregate.repository.ts` - Aggregate repository implementation

**Responsibilities**:

- Persist board entities to database
- Load boards with related entities (lists, members)
- Query boards by owner, organization, or filters
- Implement optimistic locking for concurrent updates

**Key Methods**:

- `findById(id: string): Promise<Board | null>`
- `findByOrganization(orgId: string): Promise<Board[]>`
- `save(board: Board): Promise<Board>`
- `delete(id: string): Promise<void>`
- `count(filters): Promise<number>`

### Permissions Helper

**File**: `board-permissions.helper.ts`

**Responsibilities**:

- Check if user can view/edit/delete board
- Determine user's role on board (owner, member, guest)
- Validate permission-based operations

**Key Methods**:

- `canView(userId, board): boolean`
- `canEdit(userId, board): boolean`
- `canDelete(userId, board): boolean`
- `getUserRole(userId, board): BoardRole`

### Module

**File**: `board.module.ts`

NestJS module configuration:

- Exports `BoardRepository`, `BoardAggregate`, `BoardPermissionsHelper`
- Imports TypeORM for persistence
- Registers domain event handlers

### Domain Events

**Directory**: `events/`

Events emitted by board aggregate:

- `BoardCreatedEvent` - New board created
- `BoardUpdatedEvent` - Board metadata changed
- `BoardArchivedEvent` - Board archived
- `BoardRestoredEvent` - Archived board restored
- `BoardDeletedEvent` - Board permanently deleted

## Data Flow

### Creating a Board

```text
1. Controller receives POST /boards request
2. ValidationPipe validates CreateBoardDto
3. BoardService.create() orchestrates:
   a. Check user belongs to organization
   b. Create Board domain model via Board.create()
   c. Save via BoardAggregateRepository
   d. Emit BoardCreatedEvent
4. ActivitySubscriber logs board creation
5. Return BoardResponseDto to client
```

### Loading a Board

```text
1. Controller receives GET /boards/:id request
2. BoardService.findById() queries:
   a. Check cache (Redis) for board:<id>
   b. If miss, load from BoardRepository
   c. Check user permissions via BoardPermissionsHelper
   d. Cache board for 5 minutes
3. Return BoardResponseDto to client
```

### Updating a Board

```text
1. Controller receives PATCH /boards/:id request
2. ValidationPipe validates UpdateBoardDto
3. BoardService.update() orchestrates:
   a. Load board via findById()
   b. Check edit permission
   c. Call board.update() with new values
   d. Save via repository
   e. Invalidate cache
   f. Emit BoardUpdatedEvent
4. WebSocket broadcasts update to connected clients
5. Return updated BoardResponseDto
```

## Database Schema

**Table**: `boards`

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Indexes
  INDEX idx_boards_organization (organization_id),
  INDEX idx_boards_created_by (created_by),
  INDEX idx_boards_org_archived (organization_id, is_archived)
);
```

**Relationships**:

- `organization_id` → `organizations.id` (many-to-one)
- `created_by` → `users.id` (many-to-one)
- One-to-many with `lists` (board contains lists)
- One-to-many with `board_members` (board has members)

## API Endpoints

| Method | Path                  | Description        | Auth     |
| ------ | --------------------- | ------------------ | -------- |
| GET    | `/boards`             | List user's boards | Required |
| GET    | `/boards/:id`         | Get board by ID    | Required |
| POST   | `/boards`             | Create new board   | Required |
| PATCH  | `/boards/:id`         | Update board       | Required |
| DELETE | `/boards/:id`         | Delete board       | Required |
| POST   | `/boards/:id/archive` | Archive board      | Required |
| POST   | `/boards/:id/restore` | Restore board      | Required |

See [API Documentation](../../docs/api.md) for detailed endpoint specifications.

## Testing

### Unit Tests

Test domain logic in isolation:

```typescript
describe('Board Domain Model', () => {
  it('should create board with valid data', () => {
    const board = Board.create('id', 'org-id', 'My Board', 'user-id');
    expect(board.name).toBe('My Board');
    expect(board.isArchived).toBe(false);
  });

  it('should throw error for empty name', () => {
    expect(() => Board.create('id', 'org-id', '', 'user-id')).toThrow(
      ValidationException,
    );
  });
});
```

### Integration Tests

Test repository with real database:

```typescript
describe('BoardRepository', () => {
  it('should save and load board', async () => {
    const board = Board.create('id', 'org-id', 'Test Board', 'user-id');
    await repository.save(board);

    const loaded = await repository.findById(board.id);
    expect(loaded).toBeDefined();
    expect(loaded!.name).toBe('Test Board');
  });
});
```

### API Tests

Test endpoints end-to-end:

```typescript
describe('POST /boards', () => {
  it('should create board', async () => {
    const response = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Board', organizationId: 'org-123' })
      .expect(201);

    expect(response.body.name).toBe('My Board');
  });
});
```

## Performance Considerations

### Query Optimization

- **Index on organization_id**: Fast filtering by organization
- **Composite index on (organization_id, is_archived)**: Optimizes "active boards" query
- **Eager loading**: Use `relations: ['lists', 'members']` to avoid N+1 queries

### Caching Strategy

- **Board metadata**: Cache for 5 minutes (high read, moderate write)
- **Board list**: Cache for 2 minutes (updated frequently)
- **Invalidation**: Clear cache on any board update/archive/delete

### Expected Load

- **Read-heavy**: 90% reads, 10% writes
- **Typical user**: 5-10 boards, checks boards every 5 minutes
- **Target latency**: <50ms for board list, <100ms for board details

## Related Modules

- **List Module** (`src/domain/list/`) - Lists belong to boards
- **Card Module** (`src/domain/card/`) - Cards indirectly related via lists
- **Organization Module** (`src/domain/organization/`) - Boards belong to organizations
- **Activity Module** (`src/domain/activity/`) - Tracks board changes
- **User Module** (`src/domain/user/`) - Board ownership and membership

## References

- [Architecture Guide](../../docs/architecture.md) - DDD layers and patterns
- [API Documentation](../../docs/api.md) - Endpoint specifications
- [Testing Guide](../../docs/testing.md) - Testing strategies
