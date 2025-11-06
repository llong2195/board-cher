# Developer Quickstart: Backend Clean Code & Architecture

**Feature**: 003-backend-clean-code  
**Date**: 2025-11-06  
**Audience**: Backend developers joining the project or implementing refactoring tasks

## Overview

This guide helps you quickly understand the backend architecture, set up your development environment, and start contributing with clean code practices.

**Time to first contribution**: Target 4 hours (reduced from 8+ hours)

---

## Prerequisites

**Required Software**:

- Node.js 20.x LTS
- pnpm 9.x
- PostgreSQL 14+
- Redis 7+
- Git
- VS Code (recommended) or any TypeScript-capable IDE

**Recommended VS Code Extensions**:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript (`ms-vscode.vscode-typescript-next`)
- Docker (`ms-azuretools.vscode-docker`)

---

## Quick Setup (15 minutes)

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/llong2195/board-cher.git
cd board-cher

# Install dependencies (monorepo root)
pnpm install

# Navigate to backend package
cd packages/backend
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your local settings
nano .env
```

**Required Environment Variables**:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=trello_vibe_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRATION=7d

# Email (optional for local dev)
EMAIL_PROVIDER=local  # or aws-ses, sendgrid, etc.

# Server
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker run --name trello-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trello_vibe_dev \
  -p 5432:5432 \
  -d postgres:14

# Run migrations
pnpm migration:run

# Verify connection
pnpm run start:dev
# You should see: "Application is running on: http://localhost:3000"
```

### 4. Redis Setup

```bash
# Start Redis (using Docker)
docker run --name trello-redis \
  -p 6379:6379 \
  -d redis:7

# Verify connection
redis-cli ping
# Should return: PONG
```

### 5. Verify Setup

```bash
# Run tests
pnpm test

# Run linter
pnpm lint

# Start dev server
pnpm dev

# Access API documentation
open http://localhost:3000/api/docs
```

---

## Architecture Overview (20 minutes)

### Layered Architecture (Domain-Driven Design)

```text
┌─────────────────────────────────────────────────┐
│          Presentation Layer                     │
│  (Controllers, DTOs, Guards, Filters)           │
│  - HTTP endpoints                               │
│  - Request validation                           │
│  - Response serialization                       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Application Layer                      │
│  (Commands, Queries, Services, Subscribers)     │
│  - Use cases / business workflows               │
│  - CQRS pattern                                 │
│  - Event handling                               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Domain Layer                           │
│  (Entities, Repositories, Services)             │
│  - Business logic                               │
│  - Domain rules                                 │
│  - Core models                                  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Infrastructure Layer                   │
│  (Database, Cache, Email, Storage, WebSocket)   │
│  - External services                            │
│  - Data persistence                             │
│  - Third-party integrations                     │
└─────────────────────────────────────────────────┘
```

### Request Flow

```text
1. HTTP Request
   ↓
2. Controller (presentation/)
   - Route matching
   - Authentication/Authorization (Guards)
   ↓
3. Validation (DTO with class-validator)
   - Type checking
   - Field validation
   ↓
4. Application Service (application/)
   - Orchestrate workflow
   - Call domain services
   ↓
5. Domain Service (domain/)
   - Apply business rules
   - Validate domain constraints
   ↓
6. Repository (domain/*/repositories/)
   - Data access
   - Query building
   ↓
7. Database (infrastructure/persistence/)
   - Execute queries
   - Return data
   ↓
8. Response DTO (presentation/dto/response/)
   - Serialize data
   - Exclude sensitive fields
   ↓
9. HTTP Response
```

---

## Project Structure (15 minutes)

### Domain Modules

Each domain module follows this structure:

```text
src/domain/board/
├── entities/
│   ├── board.entity.ts           # TypeORM entity
│   └── board-member.entity.ts    # Related entities
├── repositories/
│   └── board.repository.ts       # Data access interface
├── services/
│   └── board.service.ts          # Domain business logic
└── README.md                     # Module documentation
```

### Key Directories

| Directory             | Purpose                     | Examples                                |
| --------------------- | --------------------------- | --------------------------------------- |
| `src/domain/`         | Business entities and logic | `board/`, `card/`, `user/`              |
| `src/application/`    | Use cases (CQRS)            | `commands/`, `queries/`, `services/`    |
| `src/infrastructure/` | External services           | `persistence/`, `cache/`, `email/`      |
| `src/presentation/`   | HTTP layer                  | `controllers/`, `dto/`, `filters/`      |
| `src/config/`         | Configuration               | `database.config.ts`, `redis.config.ts` |
| `test/unit/`          | Unit tests                  | Service and repository tests            |
| `test/integration/`   | Integration tests           | API endpoint tests                      |
| `migrations/`         | Database migrations         | TypeORM migrations                      |

---

## Development Workflow (30 minutes)

### Test-Driven Development (TDD) Cycle

**1. Write Test First**

```typescript
// test/unit/domain/board/board.service.spec.ts
describe('BoardService', () => {
  let service: BoardService;
  let repository: MockType<BoardRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: BoardRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(BoardService);
    repository = module.get(BoardRepository);
  });

  describe('createBoard', () => {
    it('should create board with valid data', async () => {
      // Arrange
      const dto = { title: 'Test Board', visibility: 'private' };
      const expected = { id: '123', ...dto, createdAt: new Date() };
      repository.save.mockResolvedValue(expected);

      // Act
      const result = await service.createBoard('user-1', dto);

      // Assert
      expect(result).toEqual(expected);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ title: dto.title }));
    });
  });
});
```

**2. Run Test (Should Fail)**

```bash
pnpm test board.service.spec.ts
# Expected: Test fails because implementation doesn't exist yet
```

**3. Implement Minimum Code**

```typescript
// src/domain/board/services/board.service.ts
@Injectable()
export class BoardService {
  constructor(private readonly repository: BoardRepository) {}

  async createBoard(userId: string, dto: CreateBoardDto): Promise<Board> {
    const board = this.repository.create({
      title: dto.title,
      visibility: dto.visibility,
      userId,
    });

    return this.repository.save(board);
  }
}
```

**4. Run Test (Should Pass)**

```bash
pnpm test board.service.spec.ts
# Expected: Test passes
```

**5. Refactor (Improve Code Quality)**

```typescript
// Add validation, error handling, business logic
@Injectable()
export class BoardService {
  constructor(
    private readonly repository: BoardRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Creates a new board owned by the specified user.
   *
   * @param userId - Owner user ID
   * @param dto - Board creation data
   * @returns Created board with generated ID
   * @throws {BoardValidationException} If title is invalid
   */
  async createBoard(userId: string, dto: CreateBoardDto): Promise<Board> {
    this.logger.log(`Creating board for user ${userId}: ${dto.title}`);

    // Business rule: User can't have duplicate board titles
    const existing = await this.repository.findByUserAndTitle(userId, dto.title);
    if (existing) {
      throw new BoardConflictException('Board with this title already exists');
    }

    const board = this.repository.create({
      title: dto.title,
      visibility: dto.visibility,
      userId,
    });

    const saved = await this.repository.save(board);

    this.logger.log(`Board created: ${saved.id}`);
    return saved;
  }
}
```

**6. Run All Tests**

```bash
pnpm test
# Expected: All tests pass, coverage meets threshold
```

---

## Code Quality Standards (20 minutes)

### TypeScript Strict Mode

**Rules**:

- No `any` types (use `unknown` if truly dynamic, then validate)
- Explicit return types on all public methods
- Null/undefined must be explicit (`string | null`, not just `string`)

**Example**:

```typescript
// ❌ BAD: Implicit any, no return type
async findById(id) {
  return this.repository.findOne({ where: { id } });
}

// ✅ GOOD: Explicit types
async findById(id: string): Promise<Board | null> {
  return this.repository.findOne({ where: { id } });
}
```

### Function Complexity

**Rules**:

- Max 20 lines per function
- Max cyclomatic complexity: 10
- Single responsibility

**Example**:

```typescript
// ❌ BAD: Too complex (complexity > 10)
async updateBoard(id: string, dto: UpdateBoardDto): Promise<Board> {
  const board = await this.repository.findOne({ where: { id } });
  if (!board) throw new NotFoundException();
  if (!dto.title && !dto.description && !dto.visibility) {
    throw new BadRequestException('No fields to update');
  }
  if (dto.title && dto.title.length < 3) {
    throw new BadRequestException('Title too short');
  }
  if (dto.title && dto.title.length > 100) {
    throw new BadRequestException('Title too long');
  }
  // ... more validation
  board.title = dto.title || board.title;
  board.description = dto.description ?? board.description;
  return this.repository.save(board);
}

// ✅ GOOD: Extracted complexity
async updateBoard(id: string, dto: UpdateBoardDto): Promise<Board> {
  const board = await this.findBoardOrThrow(id);
  this.validateUpdateDto(dto);
  const updated = this.applyUpdates(board, dto);
  return this.repository.save(updated);
}

private async findBoardOrThrow(id: string): Promise<Board> {
  const board = await this.repository.findOne({ where: { id } });
  if (!board) {
    throw new BoardNotFoundException(id);
  }
  return board;
}

private validateUpdateDto(dto: UpdateBoardDto): void {
  if (Object.keys(dto).length === 0) {
    throw new BadRequestException('No fields to update');
  }
  // Validation moved to DTO class-validator decorators
}

private applyUpdates(board: Board, dto: UpdateBoardDto): Board {
  return {
    ...board,
    title: dto.title ?? board.title,
    description: dto.description ?? board.description,
    visibility: dto.visibility ?? board.visibility,
  };
}
```

### Documentation Standards

**Required JSDoc**:

- All public classes, methods, interfaces
- Include `@param`, `@returns`, `@throws`, `@example`

**Example**:

````typescript
/**
 * Service responsible for board management operations.
 *
 * Implements authorization checks to ensure users can only access
 * boards they own or are members of. Uses repository pattern for
 * data access and publishes domain events for audit logging.
 *
 * @example
 * ```typescript
 * const board = await boardService.createBoard('user-123', {
 *   title: 'Project Roadmap',
 *   visibility: BoardVisibility.PRIVATE,
 * });
 * ```
 */
@Injectable()
export class BoardService {
  /**
   * Finds board by ID with access control.
   *
   * @param boardId - Board unique identifier
   * @param userId - Requesting user ID
   * @returns Board if found and accessible
   * @throws {BoardNotFoundException} When board doesn't exist
   * @throws {ForbiddenException} When user lacks access
   */
  async findByIdForUser(boardId: string, userId: string): Promise<Board> {
    // Implementation
  }
}
````

---

## Common Tasks (45 minutes)

### Task 1: Add a New Endpoint

**Scenario**: Add endpoint to archive a board

**1. Define DTO**

```typescript
// src/presentation/dto/request/archive-board.dto.ts
export class ArchiveBoardDto {
  @IsBoolean()
  @ApiProperty({ description: 'Whether to archive or unarchive' })
  archived: boolean;
}
```

**2. Add Service Method**

```typescript
// src/domain/board/services/board.service.ts
async archiveBoard(boardId: string, userId: string): Promise<Board> {
  const board = await this.findBoardOrThrow(boardId);
  this.ensureUserOwnsBoard(board, userId);

  board.archivedAt = new Date();
  return this.repository.save(board);
}
```

**3. Add Controller Endpoint**

```typescript
// src/presentation/controllers/board.controller.ts
@Patch(':id/archive')
@ApiOperation({ summary: 'Archive a board' })
@ApiResponse({ status: 200, type: BoardResponseDto })
async archive(
  @Param('id') id: string,
  @Body() dto: ArchiveBoardDto,
  @CurrentUser() user: User,
): Promise<BoardResponseDto> {
  const board = dto.archived
    ? await this.boardService.archiveBoard(id, user.id)
    : await this.boardService.unarchiveBoard(id, user.id);

  return this.mapper.toResponseDto(board);
}
```

**4. Write Tests**

```typescript
// test/unit/domain/board/board.service.spec.ts
describe('archiveBoard', () => {
  it('should archive board when user is owner', async () => {
    const board = { id: '1', userId: 'user-1', archivedAt: null };
    repository.findOne.mockResolvedValue(board);
    repository.save.mockImplementation((b) => Promise.resolve(b));

    const result = await service.archiveBoard('1', 'user-1');

    expect(result.archivedAt).toBeDefined();
  });

  it('should throw ForbiddenException when user is not owner', async () => {
    const board = { id: '1', userId: 'user-1' };
    repository.findOne.mockResolvedValue(board);

    await expect(service.archiveBoard('1', 'user-2')).rejects.toThrow(ForbiddenException);
  });
});
```

**5. Verify**

```bash
pnpm test board.service.spec.ts
pnpm test:e2e  # Integration tests
pnpm dev       # Manual testing
```

---

### Task 2: Optimize a Slow Query

**Scenario**: Board loading is slow due to N+1 queries

**1. Identify Problem**

```typescript
// ❌ BAD: N+1 query problem
const boards = await this.repository.find({ where: { userId } });
for (const board of boards) {
  board.lists = await this.listRepository.find({ where: { boardId: board.id } });
  // +1 query per board
}
```

**2. Add Performance Test**

```typescript
describe('performance', () => {
  it('should load boards with lists using minimal queries', async () => {
    const queryCounter = new QueryCounter(dataSource);

    await service.findBoardsForUser('user-1');

    const queryCount = queryCounter.getCount();
    expect(queryCount).toBeLessThanOrEqual(2); // 1-2 queries max
  });
});
```

**3. Fix with Eager Loading**

```typescript
// ✅ GOOD: Single query with JOIN
async findBoardsForUser(userId: string): Promise<Board[]> {
  return this.repository.find({
    where: { userId },
    relations: {
      lists: {
        cards: true,  // Nested eager loading
      },
    },
    order: {
      updatedAt: 'DESC',
      lists: { position: 'ASC' },
      'lists.cards': { position: 'ASC' },
    },
  });
}
```

**4. Verify with EXPLAIN ANALYZE**

```typescript
const explain = await dataSource.query(
  `
  EXPLAIN ANALYZE
  SELECT * FROM boards b
  LEFT JOIN lists l ON l.board_id = b.id
  WHERE b.user_id = $1
`,
  [userId],
);

console.log(explain);
// Should show Index Scan, not Seq Scan
```

**5. Add Index if Needed**

```typescript
// Create migration
pnpm migration:create AddIndexToBoardUserId

// In migration file
export class AddIndexToBoardUserId1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_boards_user_id
      ON boards(user_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_boards_user_id`);
  }
}
```

---

### Task 3: Add Caching

**Scenario**: Board metadata is accessed frequently

**1. Inject Cache Manager**

```typescript
@Injectable()
export class BoardService {
  constructor(
    private readonly repository: BoardRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
}
```

**2. Implement Cache-Aside Pattern**

```typescript
async findById(boardId: string): Promise<Board | null> {
  const cacheKey = `board:${boardId}`;

  // Try cache first
  const cached = await this.cacheManager.get<Board>(cacheKey);
  if (cached) {
    this.logger.debug(`Cache hit: ${cacheKey}`);
    return cached;
  }

  // Cache miss - fetch from database
  this.logger.debug(`Cache miss: ${cacheKey}`);
  const board = await this.repository.findOne({ where: { id: boardId } });

  if (board) {
    // Store in cache with 5 minute TTL
    await this.cacheManager.set(cacheKey, board, 300000);
  }

  return board;
}

async updateBoard(boardId: string, dto: UpdateBoardDto): Promise<Board> {
  const board = await this.findBoardOrThrow(boardId);
  const updated = await this.repository.save({ ...board, ...dto });

  // Invalidate cache on update
  await this.cacheManager.del(`board:${boardId}`);

  return updated;
}
```

**3. Test Cache Behavior**

```typescript
describe('caching', () => {
  it('should use cache on second call', async () => {
    repository.findOne.mockResolvedValue(mockBoard);

    await service.findById('1'); // Cache miss
    await service.findById('1'); // Cache hit

    expect(repository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache on update', async () => {
    repository.findOne.mockResolvedValue(mockBoard);
    repository.save.mockResolvedValue({ ...mockBoard, title: 'Updated' });

    await service.findById('1'); // Populate cache
    await service.updateBoard('1', { title: 'Updated' });
    await service.findById('1'); // Cache miss (was invalidated)

    expect(repository.findOne).toHaveBeenCalledTimes(2);
  });
});
```

---

## Debugging Tips (15 minutes)

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/packages/backend",
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/packages/backend/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "${file}"],
      "cwd": "${workspaceFolder}/packages/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Common Issues

**Issue**: `Cannot connect to database`
**Solution**: Verify PostgreSQL is running and credentials in `.env` are correct

```bash
psql -U postgres -h localhost -d trello_vibe_dev
# If this fails, check Docker container or PostgreSQL service
```

**Issue**: `Redis connection refused`
**Solution**: Verify Redis is running

```bash
redis-cli ping
# Should return PONG
```

**Issue**: `Tests fail with "Cannot find module"`
**Solution**: Clear Jest cache

```bash
pnpm test --clearCache
```

**Issue**: TypeScript errors in IDE but build succeeds
**Solution**: Restart TypeScript server

```
VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Next Steps

**After completing this quickstart**:

1. **Read Architecture Documentation**: `docs/architecture.md`
2. **Review Constitution**: `.specify/memory/constitution.md`
3. **Pick a Task**: Check `specs/003-backend-clean-code/tasks.md` (after `/speckit.tasks`)
4. **Join Team Chat**: Ask questions, share learnings
5. **Make First PR**: Follow TDD workflow, get code review

**Resources**:

- NestJS Documentation: https://docs.nestjs.com
- TypeORM Documentation: https://typeorm.io
- Project Constitution: `.specify/memory/constitution.md`
- API Documentation: http://localhost:3000/api/docs (when running)

---

## Summary

**Setup Time**: ~15 minutes  
**Learning Time**: ~2 hours  
**First Task Time**: ~1 hour  
**Total to First Contribution**: ~4 hours

You now understand:

- ✅ Architecture layers and request flow
- ✅ Project structure and conventions
- ✅ TDD workflow (Red → Green → Refactor)
- ✅ Code quality standards
- ✅ Common development tasks
- ✅ Debugging techniques

**Ready to contribute!** Pick a task and start coding. Remember: Write tests first, keep functions small, document your code, and ask for help when needed. 🚀
