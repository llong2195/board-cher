# Research: Backend Clean Code & Architecture

**Feature**: 003-backend-clean-code  
**Date**: 2025-11-06  
**Status**: Complete

## Research Areas

This document consolidates research findings for implementing clean code practices and architectural improvements in the NestJS backend.

---

## 1. Clean Code Patterns for NestJS

### Decision: Adopt NestJS Best Practices with Enhanced DDD

**Rationale**:

- Current codebase already uses DDD layering (domain, application, infrastructure, presentation)
- NestJS's dependency injection aligns perfectly with clean architecture principles
- TypeScript's type system enables compile-time safety when properly configured

**Key Patterns to Apply**:

1. **Single Responsibility Principle (SRP)**
   - Services should handle one cohesive responsibility
   - Maximum 20 lines per function, cyclomatic complexity ≤ 10
   - Extract complex logic into separate service methods or domain services

2. **Dependency Inversion Principle (DIP)**
   - Program against interfaces, not concrete implementations
   - Use constructor injection for all dependencies
   - Repository pattern abstracts data access behind interfaces

3. **Interface Segregation Principle (ISP)**
   - Define focused interfaces for repositories and external services
   - Avoid "god interfaces" with dozens of methods
   - Use composition over inheritance

4. **Open/Closed Principle (OCP)**
   - Use strategies and factories for extensibility
   - Example: Email service supports multiple providers via strategy pattern

**Alternatives Considered**:

- **Hexagonal Architecture**: Too rigid for incremental refactoring, would require major restructuring
- **Clean Architecture (Uncle Bob)**: Conceptually similar to DDD but adds layers that NestJS already provides
- **Anemic Domain Model**: Rejected - leads to service classes with all logic, violating SRP

**Implementation Approach**:

- Audit existing services for SRP violations
- Extract complex methods into separate services or domain logic
- Document patterns in module-level README files
- Use ESLint rules to enforce complexity limits

---

## 2. Error Handling Strategies

### Decision: Multi-Layer Exception Handling with Custom Exception Classes

**Rationale**:

- Consistent error responses improve API usability
- Structured logging enables faster debugging
- Security requires sanitizing error messages (no stack traces in production)

**Architecture**:

```typescript
// Layer 1: Custom Domain Exceptions
class BoardNotFoundException extends NotFoundException {
  constructor(boardId: string) {
    super(`Board with ID ${boardId} not found`);
    this.name = 'BoardNotFoundException';
  }
}

// Layer 2: Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log with context (request ID, user ID, endpoint)
    // Return structured error response
    // Sanitize sensitive information
  }
}

// Layer 3: Structured Error Response
interface ErrorResponse {
  statusCode: number;
  errorCode: string; // e.g., "BOARD_NOT_FOUND"
  message: string; // User-friendly message
  errors?: FieldError[]; // Validation errors
  timestamp: string;
  requestId: string; // For support tracking
}
```

**Exception Hierarchy**:

- `ValidationException` (400): Invalid request data
- `NotFoundException` (404): Resource not found
- `UnauthorizedException` (401): Authentication required
- `ForbiddenException` (403): Insufficient permissions
- `ConflictException` (409): Concurrent modification conflict
- `InternalServerErrorException` (500): Unexpected system errors

**Logging Strategy**:

- **DEBUG**: Detailed validation errors, query parameters
- **INFO**: Successful operations, API calls
- **WARN**: Recoverable errors (rate limits, cache misses)
- **ERROR**: Unexpected failures, database errors
- **FATAL**: System failures (database connection lost, Redis unavailable)

**Alternatives Considered**:

- **HTTP Status Codes Only**: Insufficient - doesn't provide structured error details
- **Problem Details (RFC 7807)**: Over-engineered for internal API, adds complexity
- **Error Codes in Headers**: Non-standard, harder for clients to consume

**Security Considerations**:

- Never expose database queries or connection strings
- Sanitize stack traces in production (log server-side only)
- Mask sensitive fields in logs (passwords, tokens, credit cards)
- Use request IDs to correlate logs without exposing user data

---

## 3. Type Safety and Validation

### Decision: TypeScript Strict Mode + class-validator + class-transformer

**Rationale**:

- TypeScript strict mode catches 60-70% of runtime errors at compile time
- class-validator provides declarative validation with decorators
- class-transformer ensures type-safe serialization/deserialization

**Configuration**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true, // Enable all strict checks
    "noImplicitAny": true, // No implicit any types
    "strictNullChecks": true, // Null/undefined must be explicit
    "strictFunctionTypes": true, // Function parameter contravariance
    "strictBindCallApply": true, // Strict bind/call/apply
    "noUncheckedIndexedAccess": true // Index access returns T | undefined
  }
}
```

**DTO Validation Pattern**:

```typescript
// Request DTO
export class CreateBoardDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @ApiProperty({ description: 'Board title', example: 'Project Roadmap' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ description: 'Board description', required: false })
  description?: string;

  @IsEnum(BoardVisibility)
  @ApiProperty({ enum: BoardVisibility, default: BoardVisibility.PRIVATE })
  visibility: BoardVisibility;
}

// Response DTO
export class BoardResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Exclude() // Never expose in API responses
  deletedAt?: Date;

  @Transform(({ value }) => value?.toISOString())
  @Expose()
  createdAt: Date;
}
```

**Validation Pipe Configuration**:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Reject requests with unknown properties
    transform: true, // Auto-transform to DTO types
    transformOptions: {
      enableImplicitConversion: false, // Explicit type conversion only
    },
    exceptionFactory: (errors) => {
      // Custom validation error format
      return new ValidationException(errors);
    },
  }),
);
```

**Alternatives Considered**:

- **Zod**: Excellent but incompatible with NestJS decorators, would require rewriting all DTOs
- **Joi**: Less type-safe than class-validator, requires separate schema definitions
- **AJV**: JSON Schema-based, verbose and less intuitive than decorators

**Best Practices**:

- Define DTOs for all request/response payloads
- Use `@Exclude()` to prevent sensitive field exposure
- Validate at API boundary (controllers), not in services
- Use TypeScript's utility types (`Partial<T>`, `Pick<T, K>`, `Omit<T, K>`)

---

## 4. Testing Strategies

### Decision: Jest with Three-Layer Testing (Unit, Integration, E2E)

**Rationale**:

- Jest is NestJS's default testing framework with excellent TypeScript support
- Three-layer approach balances coverage, speed, and confidence
- Test pyramid: Many unit tests, fewer integration tests, minimal E2E tests

**Testing Architecture**:

**Unit Tests (70% of tests)**:

- Test services, repositories, utilities in isolation
- Mock all dependencies using Jest's mocking
- Fast execution (<10 seconds for full suite)
- Focus on business logic correctness

```typescript
describe('BoardService', () => {
  let service: BoardService;
  let repository: MockType<BoardRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoardService, { provide: BoardRepository, useFactory: mockRepository }],
    }).compile();

    service = module.get(BoardService);
    repository = module.get(BoardRepository);
  });

  it('should create board with valid data', async () => {
    const dto = { title: 'Test Board', visibility: 'private' };
    repository.save.mockResolvedValue({ id: '1', ...dto });

    const result = await service.createBoard(dto);

    expect(result.id).toBe('1');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
  });
});
```

**Integration Tests (25% of tests)**:

- Test API endpoints with real database using test containers or dedicated test DB
- Verify request/response contracts
- Test authentication, authorization, validation
- Database transactions rolled back after each test

```typescript
describe('BoardController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseConfig)
      .useValue(testDatabaseConfig)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('POST /boards should create board', async () => {
    return request(app.getHttpServer())
      .post('/boards')
      .send({ title: 'Integration Test Board', visibility: 'private' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe('Integration Test Board');
      });
  });

  afterEach(async () => {
    // Clean up database
    await cleanDatabase(app);
  });
});
```

**E2E Tests (5% of tests)**:

- Frontend E2E tests already exist in packages/frontend
- Backend focuses on integration tests (API contract validation)
- Use Playwright for full user journey testing (frontend responsibility)

**Test Data Strategy**:

```typescript
// Test Fixtures
export const boardFixture = {
  valid: () => ({
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    visibility: 'private',
  }),

  withLists: (listCount: number) => ({
    ...boardFixture.valid(),
    lists: Array.from({ length: listCount }, (_, i) => listFixture.valid(i)),
  }),
};

// Factory Pattern
export class BoardFactory {
  static async create(overrides?: Partial<Board>): Promise<Board> {
    const board = boardRepository.create({
      ...boardFixture.valid(),
      ...overrides,
    });
    return boardRepository.save(board);
  }
}
```

**Coverage Targets**:

- **Overall**: 80% minimum (lines, branches, functions)
- **Services**: 90% (business logic must be thoroughly tested)
- **Controllers**: 70% (integration tests cover most controller logic)
- **Repositories**: 80% (complex queries must be tested)

**Performance Testing**:

- Use k6 or autocannon for load testing
- Test scenarios:
  - 1000 concurrent users creating boards
  - 5000 cards being moved simultaneously
  - 10,000 WebSocket connections
- Measure p50, p95, p99 latencies
- Monitor database query performance

**Alternatives Considered**:

- **Mocha + Chai**: Less integrated with NestJS, verbose syntax
- **Vitest**: Excellent but ecosystem maturity favors Jest for NestJS
- **AVA**: Limited TypeScript support, smaller ecosystem

---

## 5. Performance Optimization Techniques

### Decision: Multi-Layer Optimization (Query, Cache, Connection Pool)

**Rationale**:

- Database is typically the bottleneck in web applications
- Caching reduces latency by 60-90% for frequently accessed data
- Proper indexing reduces query time by 10-100x

**Optimization Layers**:

**Layer 1: Database Query Optimization**

1. **Index Strategy**:

   ```sql
   -- Foreign keys (always index)
   CREATE INDEX idx_card_list_id ON cards(list_id);
   CREATE INDEX idx_list_board_id ON lists(board_id);

   -- Filter columns
   CREATE INDEX idx_card_status ON cards(status);
   CREATE INDEX idx_board_user_id ON boards(user_id);

   -- Sort columns
   CREATE INDEX idx_card_position ON cards(list_id, position);

   -- Composite indexes (most selective first)
   CREATE INDEX idx_card_active ON cards(list_id, deleted_at) WHERE deleted_at IS NULL;
   ```

2. **Query Optimization**:
   - Use `EXPLAIN ANALYZE` to verify index usage
   - Eliminate N+1 queries with eager loading: `relations: ['lists', 'lists.cards']`
   - Use `SELECT` only needed columns (avoid `SELECT *`)
   - Paginate large result sets (default 50, max 100 per page)

3. **Connection Pooling**:
   ```typescript
   {
     type: 'postgres',
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT),
     poolSize: 20,              // Max concurrent connections
     extra: {
       min: 5,                  // Minimum idle connections
       max: 20,                 // Maximum pool size
       idleTimeoutMillis: 10000,  // Close idle connections after 10s
       connectionTimeoutMillis: 5000,  // Fail fast on connection errors
     },
   }
   ```

**Layer 2: Redis Caching**

1. **Cache Strategy**:
   - **Cache-Aside Pattern**: Check cache, fetch from DB if miss, populate cache
   - **Write-Through**: Update cache on write operations
   - **Cache Invalidation**: Time-based (TTL) + event-based (on updates)

2. **Caching Layers**:

   ```typescript
   // User session cache (long TTL)
   await cacheManager.set(`user:${userId}`, userData, 86400); // 24 hours

   // Board metadata cache (medium TTL)
   await cacheManager.set(`board:${boardId}`, boardData, 300); // 5 minutes

   // User profile cache (long TTL)
   await cacheManager.set(`profile:${userId}`, profileData, 3600); // 1 hour

   // Activity feed cache (short TTL)
   await cacheManager.set(`activity:${boardId}`, activities, 60); // 1 minute
   ```

3. **Cache Invalidation**:

   ```typescript
   // Invalidate on update
   async updateBoard(boardId: string, dto: UpdateBoardDto) {
     const board = await this.repository.update(boardId, dto);
     await this.cacheManager.del(`board:${boardId}`);  // Clear cache
     return board;
   }

   // Pattern-based invalidation
   async deleteBoardCards(boardId: string) {
     await this.cacheManager.del(`board:${boardId}:*`);  // Clear all related cache
   }
   ```

**Layer 3: Application-Level Optimization**

1. **Batch Operations**:
   - Group database writes into transactions
   - Use `Promise.all()` for parallel independent operations
   - Debounce frequent operations (e.g., auto-save)

2. **Pagination**:

   ```typescript
   @Get()
   async findAll(
     @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
     @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
   ) {
     const maxLimit = 100;  // Prevent excessive queries
     const actualLimit = Math.min(limit, maxLimit);

     const [items, total] = await this.repository.findAndCount({
       skip: (page - 1) * actualLimit,
       take: actualLimit,
     });

     return { items, total, page, limit: actualLimit };
   }
   ```

3. **Slow Query Logging**:
   ```typescript
   // TypeORM configuration
   {
     logging: ['error', 'warn', 'schema'],
     maxQueryExecutionTime: 100,  // Log queries > 100ms
   }
   ```

**Performance Monitoring**:

- Track query execution time per endpoint
- Monitor cache hit/miss ratio
- Alert on p95 latency > 200ms
- Dashboard: Response times, throughput, error rates

**Alternatives Considered**:

- **Memcached**: Less feature-rich than Redis (no data structures, pub/sub)
- **In-Memory Cache**: Doesn't scale across instances
- **CDN Caching**: Not applicable for dynamic API responses

---

## 6. Documentation Standards

### Decision: Multi-Level Documentation (Code, API, Architecture)

**Rationale**:

- Code documentation aids developer understanding
- API documentation enables frontend integration
- Architecture documentation facilitates onboarding

**Documentation Layers**:

**Layer 1: Code Documentation (JSDoc)**

````typescript
/**
 * Service responsible for board management operations.
 *
 * Handles creation, retrieval, updating, and deletion of boards.
 * Implements authorization checks to ensure users can only access
 * boards they own or are members of.
 *
 * @example
 * ```typescript
 * const board = await boardService.createBoard(userId, {
 *   title: 'Project Roadmap',
 *   visibility: BoardVisibility.PRIVATE,
 * });
 * ```
 *
 * @throws {BoardNotFoundException} When board ID doesn't exist
 * @throws {UnauthorizedException} When user lacks board access
 */
export class BoardService {
  /**
   * Creates a new board owned by the specified user.
   *
   * @param userId - ID of the user creating the board
   * @param dto - Board creation data
   * @returns Created board with generated ID and timestamps
   * @throws {ValidationException} When DTO validation fails
   */
  async createBoard(userId: string, dto: CreateBoardDto): Promise<Board> {
    // Implementation
  }
}
````

**Layer 2: API Documentation (OpenAPI/Swagger)**

```typescript
@ApiTags('boards')
@Controller('boards')
export class BoardController {
  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiBody({ type: CreateBoardDto })
  @ApiResponse({ status: 201, description: 'Board created', type: BoardResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    // Implementation
  }
}
```

**Layer 3: Module Documentation (README)**

Each domain module should have a README:

```markdown
# Board Module

## Responsibility

Manages board lifecycle: creation, updates, deletion, and member management.

## Key Components

- `BoardService`: Business logic for board operations
- `BoardRepository`: Data access layer for board persistence
- `BoardController`: HTTP endpoints for board management
- `Board` entity: Domain model with validation rules

## Data Flow

1. Controller receives HTTP request
2. DTO validation via ValidationPipe
3. Service applies business rules
4. Repository persists to database
5. Response DTO serialized and returned

## Dependencies

- UserModule: For board ownership and member management
- ListModule: Boards contain lists
- ActivityModule: For audit logging

## Testing

- Unit tests: `board.service.spec.ts`
- Integration tests: `board.controller.integration.spec.ts`
- Test coverage: 92% (target: 90%)
```

**Layer 4: Architecture Documentation**

```markdown
# Architecture Overview

## Layered Architecture (DDD)

### Domain Layer

Business entities and domain logic. Independent of infrastructure.

### Application Layer

Use cases and application services. Orchestrates domain objects.

### Infrastructure Layer

External concerns: database, cache, email, file storage.

### Presentation Layer

HTTP controllers, DTOs, WebSocket gateways.

## Design Patterns

- **Repository Pattern**: Abstract data access
- **Service Layer**: Encapsulate business logic
- **DTO Pattern**: Validate and transform data
- **Factory Pattern**: Email providers, storage providers
- **Strategy Pattern**: Multiple payment processors
- **Event-Driven**: Domain events for loose coupling
```

**Alternatives Considered**:

- **Inline Comments Only**: Insufficient for onboarding, no API docs
- **Separate Wiki**: Gets outdated quickly, not version-controlled
- **Notion/Confluence**: Not colocated with code, harder to maintain

---

## 7. Pre-Commit Hooks and CI/CD

### Decision: Husky + lint-staged for Pre-Commit, GitHub Actions for CI

**Rationale**:

- Catch errors before commit (faster feedback)
- Ensure consistent code quality across team
- Automated testing prevents broken code from merging

**Pre-Commit Configuration**:

```json
// package.json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write", "jest --bail --findRelatedTests"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

**CI/CD Pipeline**:

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm --filter backend lint

      - name: Type check
        run: pnpm --filter backend build

      - name: Unit tests
        run: pnpm --filter backend test:cov

      - name: Integration tests
        run: pnpm --filter backend test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/backend/coverage/lcov.info
```

**Alternatives Considered**:

- **Pre-push hooks**: Too late in workflow, commits already made
- **GitLab CI**: Not applicable (using GitHub)
- **Jenkins**: Over-engineered for monorepo, GitHub Actions is simpler

---

## Implementation Priority

Based on impact and dependencies:

**Phase 1 (High Impact, Low Risk)**:

1. TypeScript strict mode enforcement (immediate error detection)
2. ESLint complexity rules (prevent tech debt accumulation)
3. JSDoc documentation (improves code comprehension)
4. Unit test infrastructure (enables TDD workflow)

**Phase 2 (Medium Impact, Medium Risk)**:

1. Custom exception classes (standardize error handling)
2. Global exception filter (consistent API error responses)
3. Request/response DTO validation (prevent bad data)
4. Integration test suite (verify API contracts)

**Phase 3 (High Impact, Higher Risk)**:

1. Database query optimization (requires careful testing)
2. Redis caching layer (changes data flow)
3. Connection pool tuning (impacts system stability)
4. Performance testing (establishes baseline)

**Phase 4 (Polish & Documentation)**:

1. OpenAPI documentation generation
2. Module README files
3. Architecture documentation
4. Developer onboarding guide (quickstart.md)

---

## Risks and Mitigations

| Risk                                          | Impact | Probability | Mitigation                                                   |
| --------------------------------------------- | ------ | ----------- | ------------------------------------------------------------ |
| Breaking changes during refactoring           | High   | Medium      | Comprehensive test suite, incremental changes, feature flags |
| Performance degradation from new abstractions | Medium | Low         | Performance tests, profiling, benchmarks before/after        |
| Incomplete test coverage                      | Medium | Medium      | Coverage thresholds in CI, mandatory tests for new code      |
| Team resistance to stricter standards         | Low    | Medium      | Document benefits, provide examples, gradual rollout         |
| Increased build time from pre-commit hooks    | Low    | High        | Optimize linters, cache dependencies, parallel execution     |

---

## Success Metrics

**Code Quality**:

- Zero ESLint errors/warnings
- Zero TypeScript compilation errors
- Average cyclomatic complexity < 5
- 100% JSDoc coverage for public APIs

**Testing**:

- 80%+ code coverage
- <30s unit test execution
- <2min full test suite
- 100% CI/CD success rate

**Performance**:

- API p95 latency <200ms
- Database query p95 <50ms
- Cache hit rate >80%
- Zero N+1 query patterns

**Developer Experience**:

- New developer onboarding time <4 hours
- Code review approval rate >95%
- Bug fix time reduced by 50%
- Development velocity increased by 40%

---

## Conclusion

This research provides a comprehensive foundation for refactoring the backend codebase. All decisions prioritize:

1. **Maintainability**: Clean code, documentation, testing
2. **Reliability**: Error handling, validation, monitoring
3. **Performance**: Query optimization, caching, connection pooling
4. **Developer Experience**: Clear patterns, good documentation, fast feedback

The incremental approach allows continuous deployment without breaking changes, while the comprehensive test suite ensures confidence in refactoring efforts.
