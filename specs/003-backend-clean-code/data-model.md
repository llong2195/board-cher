# Data Model: Backend Clean Code & Architecture

**Feature**: 003-backend-clean-code  
**Date**: 2025-11-06  
**Status**: Complete

## Overview

This document describes the **impact of refactoring** on the existing data model. This is **NOT a new feature** - we are improving code quality without changing the database schema or API contracts.

**Key Point**: No new entities, relationships, or migrations are required. All changes are internal refactoring to improve code organization, documentation, and type safety.

---

## Existing Data Model (No Changes)

The current database schema remains unchanged. For reference, the existing entities are:

### Core Entities

**Board**

- Primary workspace container
- Fields: id, title, description, visibility, settings, userId (owner), createdAt, updatedAt, deletedAt
- Relationships: hasMany(List), hasMany(Member), hasMany(Label), hasMany(Activity)

**List**

- Vertical column within a board
- Fields: id, title, position, boardId, createdAt, updatedAt, deletedAt
- Relationships: belongsTo(Board), hasMany(Card)

**Card**

- Task/item within a list
- Fields: id, title, description, position, dueDate, listId, createdAt, updatedAt, deletedAt
- Relationships: belongsTo(List), hasMany(Comment), hasMany(Attachment), hasMany(Checklist), belongsToMany(Label), belongsToMany(User as assignees)

**User**

- System user
- Fields: id, email, password (hashed), firstName, lastName, avatar, createdAt, updatedAt
- Relationships: hasMany(Board as owner), belongsToMany(Board as member), belongsToMany(Card as assignee)

**Comment**

- Discussion on cards
- Fields: id, content, cardId, userId, createdAt, updatedAt, deletedAt
- Relationships: belongsTo(Card), belongsTo(User)

**Label**

- Color-coded tags
- Fields: id, name, color, boardId, createdAt, updatedAt
- Relationships: belongsTo(Board), belongsToMany(Card)

**Checklist**

- Task list within cards
- Fields: id, title, position, cardId, createdAt, updatedAt
- Relationships: belongsTo(Card), hasMany(ChecklistItem)

**ChecklistItem**

- Individual checklist task
- Fields: id, title, checked, position, checklistId, createdAt, updatedAt
- Relationships: belongsTo(Checklist)

**Attachment**

- File attached to card
- Fields: id, filename, url, mimeType, size, cardId, userId, createdAt, updatedAt
- Relationships: belongsTo(Card), belongsTo(User as uploader)

**Activity**

- Audit log of board actions
- Fields: id, type, data (jsonb), userId, boardId, cardId, createdAt
- Relationships: belongsTo(User), belongsTo(Board), belongsTo(Card, optional)

**Organization**

- Multi-board workspace
- Fields: id, name, description, ownerId, createdAt, updatedAt
- Relationships: belongsTo(User as owner), hasMany(Board), belongsToMany(User as members)

---

## Refactoring Impact on Entities

### 1. Enhanced Type Safety

**Current State**: Some entities may use implicit types or `any` types  
**Target State**: All entities use explicit TypeORM decorators with full type definitions

**Example Improvements**:

```typescript
// Before (implicit types)
@Entity('boards')
export class Board {
  @Column()
  title: string;

  @Column()
  settings: any; // ❌ No type safety
}

// After (explicit types)
@Entity('boards')
export class Board {
  @Column({ type: 'varchar', length: 100, nullable: false })
  @ApiProperty({ description: 'Board title', maxLength: 100 })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ description: 'Board configuration', type: BoardSettings })
  settings: BoardSettings; // ✅ Type-safe value object
}
```

**Impact**: Compile-time type checking, better IDE support, prevents type coercion bugs

---

### 2. Value Objects for Complex Fields

**Current State**: Complex fields stored as raw JSON  
**Target State**: Typed value objects with validation

**Example**:

```typescript
// Value object for board settings
export class BoardSettings {
  @IsOptional()
  @IsBoolean()
  allowComments: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowAttachments: boolean = true;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsEnum(BoardTemplate)
  template?: BoardTemplate;
}

// Activity data value object
export class ActivityData {
  @IsOptional()
  @IsString()
  oldValue?: string;

  @IsOptional()
  @IsString()
  newValue?: string;

  @IsOptional()
  @IsString()
  fieldName?: string;
}
```

**Impact**: Type-safe JSON columns, validation at domain layer, better documentation

---

### 3. Entity Documentation

**Current State**: Minimal or no JSDoc on entities  
**Target State**: Comprehensive JSDoc explaining purpose, constraints, relationships

**Example**:

```typescript
/**
 * Board entity represents a kanban board workspace.
 *
 * A board is the primary container for organizing work. It contains
 * lists (columns) which contain cards (tasks). Boards have owners
 * and can have multiple members with different permission levels.
 *
 * **Visibility**:
 * - PRIVATE: Only owner and explicit members can access
 * - ORGANIZATION: All organization members can access
 * - PUBLIC: Anyone with the link can view (read-only)
 *
 * **Soft Delete**: Boards use soft delete (deletedAt field).
 * Deleted boards are hidden but retained for 30 days before permanent deletion.
 *
 * @entity boards
 * @see {@link List} for board contents
 * @see {@link BoardMember} for access control
 */
@Entity('boards')
@Index(['userId', 'deletedAt']) // Query optimization
@Index(['organizationId', 'deletedAt'])
export class Board {
  /**
   * Unique identifier (UUID v4)
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Board unique identifier', format: 'uuid' })
  id: string;

  /**
   * Board title (3-100 characters)
   * @example "Product Roadmap Q4 2025"
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  @ApiProperty({ description: 'Board title', minLength: 3, maxLength: 100 })
  title: string;

  // ... more documented fields
}
```

**Impact**: Better onboarding, clearer domain model understanding, IDE documentation tooltips

---

### 4. Custom Repository Methods

**Current State**: Generic TypeORM repository methods  
**Target State**: Domain-specific repository methods with optimized queries

**Example**:

```typescript
/**
 * Repository for Board entity with optimized query methods.
 *
 * Provides domain-specific queries that are optimized for common
 * access patterns with proper eager loading to prevent N+1 queries.
 */
@Injectable()
export class BoardRepository extends Repository<Board> {
  constructor(private dataSource: DataSource) {
    super(Board, dataSource.createEntityManager());
  }

  /**
   * Find board by ID with all lists and cards eagerly loaded.
   * Optimized query using JOIN to prevent N+1 problem.
   *
   * @param boardId - Board unique identifier
   * @returns Board with nested lists and cards, or null if not found
   * @throws {QueryFailedError} If database query fails
   */
  async findByIdWithLists(boardId: string): Promise<Board | null> {
    return this.findOne({
      where: { id: boardId, deletedAt: IsNull() },
      relations: {
        lists: {
          cards: true, // Eager load cards within lists
        },
        members: {
          user: true, // Eager load member user details
        },
      },
      order: {
        lists: { position: 'ASC' },
        'lists.cards': { position: 'ASC' },
      },
    });
  }

  /**
   * Find boards accessible by user (owned or member).
   * Uses optimized query with indexes on userId and organizationId.
   *
   * @param userId - User unique identifier
   * @param options - Pagination and filtering options
   * @returns Paginated list of accessible boards
   */
  async findAccessibleByUser(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<Board>> {
    const query = this.createQueryBuilder('board')
      .leftJoinAndSelect('board.members', 'member')
      .where('board.userId = :userId', { userId })
      .orWhere('member.userId = :userId', { userId })
      .andWhere('board.deletedAt IS NULL')
      .skip(options.offset)
      .take(options.limit)
      .orderBy('board.updatedAt', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total, ...options };
  }
}
```

**Impact**: Prevents N+1 queries, encapsulates query logic, better performance

---

### 5. Entity Validation Rules

**Current State**: Validation only in DTOs  
**Target State**: Domain-level validation in entities

**Example**:

```typescript
@Entity('cards')
export class Card {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  /**
   * Validates business rules before persisting.
   * Throws domain exception if validation fails.
   *
   * @throws {CardValidationException} If business rules violated
   */
  @BeforeInsert()
  @BeforeUpdate()
  validateBusinessRules() {
    if (this.title.trim().length < 3) {
      throw new CardValidationException('Title must be at least 3 characters');
    }

    if (this.dueDate && this.dueDate < new Date()) {
      throw new CardValidationException('Due date cannot be in the past');
    }

    if (this.position < 0) {
      throw new CardValidationException('Position must be non-negative');
    }
  }

  /**
   * Business logic: Check if card is overdue
   */
  isOverdue(): boolean {
    return this.dueDate !== null && this.dueDate < new Date();
  }

  /**
   * Business logic: Check if card is complete
   */
  isComplete(): boolean {
    if (!this.checklists || this.checklists.length === 0) {
      return false;
    }

    return this.checklists.every((checklist) => checklist.items.every((item) => item.checked));
  }
}
```

**Impact**: Domain logic colocated with data, consistent validation, richer domain model

---

## Migration Strategy

**No Database Migrations Required** - This refactoring does not change the schema.

However, we will:

1. **Audit Existing Migrations**: Review all migrations in `packages/backend/migrations/` to ensure they match current entity definitions

2. **Document Schema**: Create comprehensive schema documentation explaining:
   - Entity relationships
   - Index strategy (why each index exists)
   - Soft delete implementation
   - JSONB column structures

3. **Migration Best Practices**: Document migration workflow:
   - Always generate migrations, never write manually
   - Test migrations on copy of production data
   - Include both up and down migrations
   - Never modify existing migrations (create new ones)

---

## API Contract Validation

**No API Changes Required** - This refactoring maintains backward compatibility.

We will generate OpenAPI documentation to validate that:

1. **Request DTOs** match current API contracts
2. **Response DTOs** maintain same field structure
3. **HTTP Status Codes** remain consistent
4. **Error Response Format** is standardized

**Validation Process**:

```bash
# Generate OpenAPI spec from current code
pnpm --filter backend build
pnpm --filter backend start:dev

# Access Swagger UI
open http://localhost:3000/api/docs

# Export OpenAPI spec
curl http://localhost:3000/api/docs-json > contracts/openapi-baseline.json

# Compare with spec after refactoring
curl http://localhost:3000/api/docs-json > contracts/openapi-refactored.json
diff contracts/openapi-baseline.json contracts/openapi-refactored.json

# Expect: No changes to API contracts (only documentation improvements)
```

---

## Database Performance Impact

### Indexes to Verify

Ensure these indexes exist for optimal query performance:

```sql
-- Foreign keys (critical for joins)
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_organization_id ON boards(organization_id);

-- Soft delete queries
CREATE INDEX IF NOT EXISTS idx_boards_deleted_at ON boards(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON cards(deleted_at) WHERE deleted_at IS NULL;

-- Sorting and filtering
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(list_id, position);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(board_id, position);

-- Activity queries (recent activity)
CREATE INDEX IF NOT EXISTS idx_activity_board_created ON activity(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_card_created ON activity(card_id, created_at DESC);

-- User access queries
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id, board_id);
CREATE INDEX IF NOT EXISTS idx_card_assignees_user ON card_assignees(user_id, card_id);
```

### Query Performance Targets

| Query Type              | Current (est.) | Target | Optimization                             |
| ----------------------- | -------------- | ------ | ---------------------------------------- |
| Get board with lists    | 50-100ms       | <30ms  | Eager loading with JOIN                  |
| Get user's boards       | 100-200ms      | <50ms  | Index on userId + deletedAt              |
| Move card between lists | 20-50ms        | <20ms  | Single UPDATE with optimistic locking    |
| Get activity feed       | 150-300ms      | <50ms  | Index on boardId + createdAt, pagination |
| Search cards            | 500-1000ms     | <100ms | Full-text search index (GIN)             |

---

## Testing Strategy for Data Layer

### Unit Tests

```typescript
describe('Board Entity', () => {
  it('should validate business rules on save', () => {
    const board = new Board();
    board.title = 'AB'; // Too short

    expect(() => board.validateBusinessRules()).toThrow(BoardValidationException);
  });

  it('should calculate completion percentage', () => {
    const board = new Board();
    board.lists = [{ cards: [{ id: '1' }, { id: '2' }] }, { cards: [{ id: '3' }] }];

    expect(board.getTotalCardCount()).toBe(3);
  });
});
```

### Integration Tests

```typescript
describe('BoardRepository (integration)', () => {
  it('should prevent N+1 query when loading lists', async () => {
    const queryCountBefore = getQueryCount();

    const board = await repository.findByIdWithLists('board-123');

    const queryCountAfter = getQueryCount();

    // Should use single JOIN query, not N+1
    expect(queryCountAfter - queryCountBefore).toBeLessThanOrEqual(2);
    expect(board.lists).toHaveLength(3);
    expect(board.lists[0].cards).toBeDefined();
  });

  it('should use index for user boards query', async () => {
    const explain = await repository.query(
      `
      EXPLAIN ANALYZE
      SELECT * FROM boards WHERE user_id = $1 AND deleted_at IS NULL
    `,
      [userId],
    );

    // Verify index usage
    expect(explain[0]['QUERY PLAN']).toContain('Index Scan');
    expect(explain[0]['QUERY PLAN']).not.toContain('Seq Scan');
  });
});
```

---

## Summary

**Data Model Changes**: None - this is a refactoring effort  
**Database Schema Changes**: None - no migrations required  
**API Contract Changes**: None - backward compatible

**Improvements**:

- Enhanced type safety with explicit TypeORM decorators
- Value objects for complex JSON fields
- Comprehensive entity documentation
- Domain-specific repository methods
- Entity-level business logic and validation
- Query optimization with eager loading
- Index verification for performance

**Migration Strategy**: No migrations needed, audit existing schema, generate OpenAPI baseline  
**Testing Strategy**: Unit tests for entity validation, integration tests for query performance  
**Performance Impact**: Improved (prevent N+1, better indexes, optimized queries)
