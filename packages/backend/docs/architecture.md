# Backend Architecture

**Last Updated**: 2025-11-06  
**Version**: 1.0.0  
**Status**: Refactored (003-backend-clean-code)

## Overview

This document describes the architecture of the Trello Vibe backend service. The system follows **Domain-Driven Design (DDD)** principles with a layered architecture pattern to ensure maintainability, testability, and scalability.

## Table of Contents

- [Architecture Principles](#architecture-principles)
- [Layer Structure](#layer-structure)
- [Request Flow](#request-flow)
- [Module Organization](#module-organization)
- [Dependency Flow](#dependency-flow)
- [Error Handling](#error-handling)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)

## Architecture Principles

### Domain-Driven Design (DDD)

We organize code around business domains rather than technical concerns:

- **Ubiquitous Language**: Code reflects business terminology (Board, Card, List, etc.)
- **Bounded Contexts**: Clear module boundaries with well-defined interfaces
- **Domain Events**: Asynchronous communication between modules using EventEmitter
- **Aggregate Roots**: Entities that ensure business invariants (e.g., Board ensures Lists are valid)

### SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Interfaces define contracts, implementations are interchangeable
- **Interface Segregation**: Small, focused interfaces (IRepository, ICache, etc.)
- **Dependency Inversion**: Depend on abstractions (interfaces), not concrete implementations

### Clean Code Practices

- **Explicit over Implicit**: Strict TypeScript types, no `any`
- **Small Functions**: Max 20 lines per function, max complexity 10
- **Test-First**: TDD workflow, 80%+ coverage required
- **Documentation**: JSDoc for public APIs, module READMEs for context

## Layer Structure

Our architecture follows a **4-layer pattern** from outer to inner:

```text
┌───────────────────────────────────────────────────────────┐
│                    Presentation Layer                      │
│  (HTTP Controllers, DTOs, Filters, Guards, Pipes)         │
│  • Entry point for HTTP/WebSocket requests                │
│  • Validation, serialization, error handling              │
└─────────────────────┬─────────────────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────────────────┐
│                   Application Layer                        │
│  (Use Cases, Commands, Queries, Event Handlers)           │
│  • Orchestrates domain services                           │
│  • Transaction management, event publishing               │
└─────────────────────┬─────────────────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────────────────┐
│                     Domain Layer                           │
│  (Entities, Value Objects, Domain Services)               │
│  • Core business logic and rules                          │
│  • Framework-agnostic, pure TypeScript                    │
└─────────────────────┬─────────────────────────────────────┘
                      │ depends on
┌─────────────────────▼─────────────────────────────────────┐
│                  Infrastructure Layer                      │
│  (Repositories, Database, Cache, Email, Storage)          │
│  • External dependencies (TypeORM, Redis, S3, etc.)       │
│  • Implements domain interfaces (IRepository, ICache)     │
└───────────────────────────────────────────────────────────┘
```

### 1. Presentation Layer

**Location**: `src/presentation/`

**Responsibilities**:

- Handle HTTP requests and WebSocket connections
- Validate input using `class-validator` decorators
- Serialize responses using `class-transformer`
- Apply cross-cutting concerns (auth guards, logging interceptors)

**Key Components**:

- **Controllers** (`controllers/*.controller.ts`): Route handlers with `@Controller()` decorators
- **DTOs** (`dto/request/*.dto.ts`, `dto/response/*.dto.ts`): Data transfer objects with validation
- **Filters** (`filters/global-exception.filter.ts`): Centralized error handling
- **Guards** (`guards/auth.guard.ts`): Authentication/authorization checks
- **Pipes** (`pipes/validation.pipe.ts`): Input transformation and validation

**Example**:

```typescript
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  async create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    const board = await this.boardService.create(dto);
    return BoardResponseDto.from(board);
  }
}
```

### 2. Application Layer

**Location**: `src/application/`

**Responsibilities**:

- Coordinate multiple domain services to fulfill use cases
- Manage transactions and ensure data consistency
- Publish domain events to notify other modules

**Key Components**:

- **Commands** (`commands/*.command.ts`): Write operations (create, update, delete)
- **Queries** (`queries/*.query.ts`): Read operations with filtering/pagination
- **Services** (`services/*.service.ts`): Use case implementations
- **Event Handlers** (`subscribers/*.subscriber.ts`): React to domain events

**Example**:

```typescript
@Injectable()
export class CreateBoardCommand {
  constructor(
    private readonly boardService: BoardService,
    private readonly activityService: ActivityService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateBoardDto, userId: string): Promise<Board> {
    const board = await this.boardService.create(dto, userId);

    // Publish event for other modules
    this.eventEmitter.emit('board.created', { boardId: board.id, userId });

    // Log activity
    await this.activityService.logBoardCreated(board.id, userId);

    return board;
  }
}
```

### 3. Domain Layer

**Location**: `src/domain/`

**Responsibilities**:

- Define business entities and their relationships
- Enforce business rules and invariants
- Contain pure business logic (no infrastructure dependencies)

**Key Components**:

- **Entities** (`entities/*.entity.ts`): Business objects with identity (Board, Card, User)
- **Value Objects** (`value-objects/*.vo.ts`): Immutable business values (Email, BoardSettings)
- **Domain Services** (`services/*.service.ts`): Business logic that doesn't belong to a single entity
- **Repository Interfaces** (`repositories/*.repository.interface.ts`): Contracts for data access

**Example**:

```typescript
@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists: List[];

  /**
   * Validates that the board can be archived.
   * Business rule: Cannot archive a board with active cards.
   */
  canArchive(): boolean {
    return this.lists.every((list) =>
      list.cards.every((card) => card.isArchived),
    );
  }
}
```

### 4. Infrastructure Layer

**Location**: `src/infrastructure/`

**Responsibilities**:

- Implement domain interfaces (IRepository, ICache, etc.)
- Integrate with external services (database, Redis, S3, email)
- Handle framework-specific code (TypeORM, NestJS modules)

**Key Components**:

- **Repositories** (`persistence/repositories/*.repository.ts`): TypeORM implementations
- **Cache** (`cache/redis-cache.service.ts`): Redis integration
- **Email** (`email/email.service.ts`): Email provider integration
- **Storage** (`storage/s3-storage.service.ts`): File storage integration

**Example**:

```typescript
@Injectable()
export class BoardRepository implements IBoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly repository: Repository<Board>,
  ) {}

  async findById(id: string): Promise<Board | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['lists', 'members'],
    });
  }

  async save(board: Board): Promise<Board> {
    return this.repository.save(board);
  }
}
```

## Request Flow

### HTTP Request Lifecycle

1. **Client Request** → Presentation Layer
2. **Validation** → ValidationPipe validates DTO (400 if invalid)
3. **Authentication** → JwtAuthGuard checks token (401 if missing/invalid)
4. **Authorization** → RolesGuard checks permissions (403 if forbidden)
5. **Controller** → Calls application service method
6. **Application Service** → Orchestrates domain services and repositories
7. **Domain Logic** → Validates business rules, updates entities
8. **Repository** → Persists changes via TypeORM
9. **Event Publishing** → Emits domain events for side effects
10. **Response Serialization** → Transform entity to response DTO
11. **Interceptors** → Logging, timing, transformation
12. **Client Response** ← Returns serialized data

### Example: Creating a Board

```text
POST /boards
Body: { "title": "My Board", "description": "..." }

1. ValidationPipe validates CreateBoardDto
2. JwtAuthGuard extracts user from JWT token
3. BoardController.create() called
4. BoardService.create() orchestrates:
   - Validates unique board title for user
   - Creates Board entity
   - Saves via BoardRepository
   - Publishes 'board.created' event
5. ActivitySubscriber reacts to event, logs activity
6. BoardResponseDto.from(board) serializes entity
7. Global interceptor logs request timing
8. Response: { "id": "uuid", "title": "My Board", ... }
```

## Module Organization

Each domain module follows the same structure:

```text
src/domain/<module>/
├── entities/
│   └── <module>.entity.ts        # TypeORM entity
├── repositories/
│   └── <module>.repository.interface.ts  # Repository contract
├── services/
│   └── <module>.service.ts       # Domain business logic
└── README.md                      # Module documentation
```

**Current Modules**:

1. **board** - Board management (CRUD, archiving, settings)
2. **card** - Card operations (CRUD, movement, assignments)
3. **list** - List management (CRUD, ordering)
4. **user** - User accounts (profiles, authentication)
5. **activity** - Activity logging (audit trail)
6. **comment** - Card comments (threaded discussions)
7. **label** - Card labels (categorization)
8. **checklist** - Card checklists (task tracking)
9. **attachment** - Card attachments (file uploads)
10. **organization** - Multi-tenant organizations

## Dependency Flow

### Allowed Dependencies

```text
Presentation → Application → Domain → Infrastructure
                                    ↗
```

**Rules**:

- ✅ Presentation can depend on Application, Domain
- ✅ Application can depend on Domain
- ✅ Infrastructure implements Domain interfaces
- ❌ Domain CANNOT depend on Infrastructure (use interfaces)
- ❌ Lower layers CANNOT depend on upper layers

### Dependency Injection

We use **constructor injection** with explicit interfaces:

```typescript
// ✅ Good: Depends on interface
@Injectable()
export class BoardService {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly cacheService: ICacheService,
  ) {}
}

// ❌ Bad: Depends on concrete class
@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: BoardRepository) {}
}
```

## Error Handling

### Exception Hierarchy

```text
Error (JavaScript native)
└── HttpException (NestJS base)
    └── DomainException (our custom base)
        ├── ValidationException (400)
        ├── NotFoundException (404)
        ├── UnauthorizedException (401)
        ├── ForbiddenException (403)
        └── ConflictException (409)
```

### Throwing Exceptions

**Domain Layer**:

```typescript
if (!board) {
  throw new NotFoundException('Board', id);
}
```

**Application Layer**:

```typescript
if (board.ownerId !== userId) {
  throw new ForbiddenException('You do not own this board');
}
```

**Global Exception Filter** catches all exceptions and returns structured responses:

```json
{
  "statusCode": 404,
  "errorCode": "BOARD_NOT_FOUND",
  "message": "Board with ID '123' not found",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "path": "/boards/123",
  "requestId": "req-abc-123"
}
```

## Testing Strategy

### Test Pyramid

```text
           ╱╲
          ╱E2E╲         (10%) - Critical user journeys
         ╱──────╲
        ╱Integr.╲       (30%) - API, database, WebSocket
       ╱──────────╲
      ╱   Unit     ╲    (60%) - Services, repositories, helpers
     ╱──────────────╲
```

### Test Types

1. **Unit Tests** (`test/unit/`)
   - Test individual services/methods in isolation
   - Mock all dependencies
   - Fast execution (<5s for entire suite)

2. **Integration Tests** (`test/integration/`)
   - Test API endpoints with real database
   - Use transactions for isolation (rollback after each test)
   - Test repository queries against real PostgreSQL

3. **E2E Tests** (in `packages/frontend/test/e2e/`)
   - Test complete user workflows through UI
   - Frontend-driven, backend as dependency

### TDD Workflow

```bash
# 1. Write failing test
npm test -- --watch <module>.service.spec.ts

# 2. Implement minimal code to pass test
# 3. Refactor while keeping tests green
# 4. Repeat for next test case
```

See [testing.md](./testing.md) for detailed testing guide.

## Performance Considerations

### Database Optimization

- **Indexes**: All foreign keys indexed, composite indexes for common queries
- **Query Optimization**: Use `EXPLAIN ANALYZE` to identify slow queries
- **Connection Pooling**: Max 20 connections, idle timeout 30s
- **Eager Loading**: Use `relations` to prevent N+1 queries

### Caching Strategy

- **Redis Cache**: 3-tier caching (L1: in-memory, L2: Redis, L3: database)
- **TTL Configuration**:
  - User profiles: 15 minutes
  - Board metadata: 5 minutes
  - Activity feed: 1 minute
- **Cache Invalidation**: Invalidate on write operations

### WebSocket Scaling

- **Redis Adapter**: Socket.io uses Redis pub/sub for multi-instance scaling
- **Room Management**: Users join rooms for their boards (board:<id>)
- **Event Batching**: Batch multiple card movements into single WebSocket event

See [performance.md](./performance.md) for detailed optimization guide.

## Related Documentation

- [API Documentation](./api.md) - OpenAPI/Swagger usage
- [Testing Guide](./testing.md) - TDD workflow and test patterns
- [Performance Guide](./performance.md) - Query optimization and caching
- [Contributing](../../CONTRIBUTING.md) - Development workflow

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
