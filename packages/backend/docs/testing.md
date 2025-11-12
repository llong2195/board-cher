# Testing Guide

**Last Updated**: 2025-11-06  
**Version**: 1.0.0  
**Test Framework**: Jest 30.x + @nestjs/testing 11.x

## Overview

This guide documents the testing strategy, patterns, and workflows for the Trello Vibe backend. We follow **Test-Driven Development (TDD)** practices to ensure code quality, maintainability, and regression prevention.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Pyramid](#test-pyramid)
- [TDD Workflow](#tdd-workflow)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Test Fixtures](#test-fixtures)
- [Database Testing](#database-testing)
- [Mocking Strategies](#mocking-strategies)
- [Code Coverage](#code-coverage)
- [Running Tests](#running-tests)

## Testing Philosophy

### Core Principles

1. **Test First**: Write tests before implementation (TDD)
2. **Fast Feedback**: Unit tests run in <5 seconds
3. **Isolation**: Each test is independent and deterministic
4. **Clarity**: Tests document expected behavior
5. **Confidence**: 80%+ coverage, 90%+ for critical paths

### What to Test

✅ **Do test**:

- Business logic in services
- Data transformations and calculations
- Edge cases and error conditions
- API endpoint contracts
- Database queries and transactions
- Authentication and authorization

❌ **Don't test**:

- Third-party library internals
- Trivial getters/setters
- Generated code (migrations, DTOs)
- Configuration constants

## Test Pyramid

```text
           ╱╲
          ╱E2E╲         10% - Critical user journeys (frontend-driven)
         ╱──────╲
        ╱Integr.╲       30% - API endpoints, database, WebSocket
       ╱──────────╲
      ╱   Unit     ╲    60% - Services, repositories, domain logic
     ╱──────────────╲
```

### Test Distribution

| Type        | Count | Duration | Scope                 |
| ----------- | ----- | -------- | --------------------- |
| Unit        | ~800  | <5s      | Single class/function |
| Integration | ~400  | <30s     | API + DB + Services   |
| E2E         | ~50   | <2min    | Full user workflows   |

**Total**: ~1250 tests, <40s execution time

## TDD Workflow

### Red-Green-Refactor Cycle

```bash
# 1. RED: Write failing test
npm test -- --watch board.service.spec.ts

# Test fails (no implementation yet)

# 2. GREEN: Write minimal code to pass test
# Implement just enough to make test pass

# Test passes ✓

# 3. REFACTOR: Improve code while keeping tests green
# Extract methods, rename variables, simplify logic

# All tests still pass ✓

# 4. REPEAT: Add next test case
```

### Example: TDD for Creating a Board

#### Step 1: Write Failing Test (RED)

```typescript
describe('BoardService', () => {
  describe('create', () => {
    it('should create a board with valid input', async () => {
      // Arrange
      const dto: CreateBoardDto = {
        title: 'My Board',
        description: 'Test board',
      };
      const userId = 'user-123';

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe('My Board');
      expect(result.ownerId).toBe(userId);
    });
  });
});

// Test fails: BoardService.create is not a function
```

#### Step 2: Minimal Implementation (GREEN)

```typescript
@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: IBoardRepository) {}

  async create(dto: CreateBoardDto, userId: string): Promise<Board> {
    const board = new Board();
    board.id = randomUUID();
    board.title = dto.title;
    board.description = dto.description;
    board.ownerId = userId;
    board.createdAt = new Date();
    board.updatedAt = new Date();

    return this.boardRepository.save(board);
  }
}

// Test passes ✓
```

#### Step 3: Refactor (REFACTOR)

```typescript
@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: IBoardRepository) {}

  async create(dto: CreateBoardDto, userId: string): Promise<Board> {
    const board = this.buildBoardFromDto(dto, userId);
    return this.boardRepository.save(board);
  }

  private buildBoardFromDto(dto: CreateBoardDto, userId: string): Board {
    const board = new Board();
    board.id = randomUUID();
    board.title = dto.title;
    board.description = dto.description;
    board.ownerId = userId;
    board.createdAt = new Date();
    board.updatedAt = new Date();
    return board;
  }
}

// Test still passes ✓
```

#### Step 4: Add Next Test Case

```typescript
it('should throw ValidationException for empty title', async () => {
  const dto: CreateBoardDto = { title: '', description: '' };

  await expect(service.create(dto, 'user-123')).rejects.toThrow(
    ValidationException,
  );
});
```

## Unit Testing

### Service Tests

**Location**: `test/unit/domain/<module>/<service>.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from '@/domain/board/services/board.service';
import { IBoardRepository } from '@/domain/board/repositories/board.repository.interface';
import { BoardFixture } from '@test/fixtures/board.fixture';
import { NotFoundException } from '@/domain/shared/exceptions';

describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: jest.Mocked<IBoardRepository>;

  beforeEach(async () => {
    // Create mock repository
    const mockBoardRepository: Partial<IBoardRepository> = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: 'IBoardRepository',
          useValue: mockBoardRepository,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get('IBoardRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a board when found', async () => {
      // Arrange
      const board = BoardFixture.create();
      boardRepository.findById.mockResolvedValue(board);

      // Act
      const result = await service.findById(board.id);

      // Assert
      expect(result).toEqual(board);
      expect(boardRepository.findById).toHaveBeenCalledWith(board.id);
      expect(boardRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when board not found', async () => {
      // Arrange
      const boardId = 'non-existent-id';
      boardRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(boardId)).rejects.toThrow(
        NotFoundException,
      );

      expect(boardRepository.findById).toHaveBeenCalledWith(boardId);
    });
  });

  describe('create', () => {
    it('should create a board with valid input', async () => {
      // Arrange
      const dto: CreateBoardDto = {
        title: 'My Board',
        description: 'Test board',
      };
      const userId = 'user-123';
      const savedBoard = BoardFixture.create({ title: dto.title });

      boardRepository.save.mockResolvedValue(savedBoard);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result).toEqual(savedBoard);
      expect(boardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          ownerId: userId,
        }),
      );
    });
  });
});
```

### Testing Patterns

#### Arrange-Act-Assert (AAA)

```typescript
it('should do something', async () => {
  // Arrange: Set up test data and mocks
  const input = { ... };
  mockService.method.mockResolvedValue(expected);

  // Act: Execute the code under test
  const result = await service.method(input);

  // Assert: Verify the outcome
  expect(result).toEqual(expected);
  expect(mockService.method).toHaveBeenCalledWith(input);
});
```

#### Given-When-Then (BDD)

```typescript
describe('when creating a board', () => {
  it('should save board to repository given valid input', async () => {
    // Given: Initial conditions
    const validDto = { title: 'My Board' };

    // When: Action is performed
    const result = await service.create(validDto, 'user-123');

    // Then: Expected outcome
    expect(boardRepository.save).toHaveBeenCalled();
    expect(result.title).toBe('My Board');
  });
});
```

## Integration Testing

### API Endpoint Tests

**Location**: `test/integration/api/<module>.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { DatabaseHelper } from '@test/helpers/database.helper';
import { BoardFixture } from '@test/fixtures/board.fixture';
import { UserFixture } from '@test/fixtures/user.fixture';

describe('BoardController (e2e)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Create test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Initialize database helper
    dbHelper = new DatabaseHelper(moduleFixture);
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Start transaction for test isolation
    await dbHelper.startTransaction();

    // Create test user and get auth token
    testUser = await UserFixture.createAndSave(dbHelper.getManager());
    authToken = generateJwtToken(testUser.id);
  });

  afterEach(async () => {
    // Rollback transaction to clean up test data
    await dbHelper.rollbackTransaction();
  });

  describe('POST /boards', () => {
    it('should create a new board', async () => {
      const dto: CreateBoardDto = {
        title: 'My Board',
        description: 'Test board',
      };

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: dto.title,
        description: dto.description,
        ownerId: testUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = { title: '' }; // Empty title

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        message: expect.stringContaining('title'),
      });
    });

    it('should return 401 without authentication', async () => {
      const dto = { title: 'My Board' };

      await request(app.getHttpServer()).post('/boards').send(dto).expect(401);
    });
  });

  describe('GET /boards/:id', () => {
    it('should return a board by ID', async () => {
      // Arrange: Create test board
      const board = await BoardFixture.createAndSave(dbHelper.getManager(), {
        ownerId: testUser.id,
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(board.id);
      expect(response.body.title).toBe(board.title);
    });

    it('should return 404 for non-existent board', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/boards/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.errorCode).toBe('BOARD_NOT_FOUND');
    });
  });
});
```

### Database Tests

**Location**: `test/integration/database/<module>.repository.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardRepository } from '@/infrastructure/persistence/repositories/board.repository';
import { Board } from '@/domain/board/entities/board.entity';
import { DatabaseHelper } from '@test/helpers/database.helper';
import { BoardFixture } from '@test/fixtures/board.fixture';

describe('BoardRepository', () => {
  let repository: BoardRepository;
  let dbHelper: DatabaseHelper;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'test',
          password: process.env.DB_PASSWORD || 'test',
          database: process.env.DB_DATABASE || 'trello_vibe_test',
          entities: [Board],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Board]),
      ],
      providers: [BoardRepository],
    }).compile();

    repository = module.get<BoardRepository>(BoardRepository);
    dbHelper = new DatabaseHelper(module);
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.startTransaction();
  });

  afterEach(async () => {
    await dbHelper.rollbackTransaction();
  });

  describe('findById', () => {
    it('should find a board by ID', async () => {
      // Arrange
      const board = await BoardFixture.createAndSave(dbHelper.getManager());

      // Act
      const result = await repository.findById(board.id);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(board.id);
      expect(result!.title).toBe(board.title);
    });

    it('should return null for non-existent board', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findWithLists', () => {
    it('should eager load lists relationship', async () => {
      // Arrange
      const board = await BoardFixture.createWithLists(dbHelper.getManager(), {
        listCount: 3,
      });

      // Act
      const result = await repository.findWithLists(board.id);

      // Assert
      expect(result!.lists).toHaveLength(3);
      expect(result!.lists[0].title).toBeDefined();
    });
  });
});
```

## Test Fixtures

### Using BaseFixture

**Location**: `test/fixtures/<module>.fixture.ts`

```typescript
import { BaseFixture } from './base.fixture';
import { Board } from '@/domain/board/entities/board.entity';
import { EntityManager } from 'typeorm';

export class BoardFixture extends BaseFixture<Board> {
  protected build(overrides: Partial<Board> = {}): Board {
    const board = new Board();
    board.id = this.generateId();
    board.title = overrides.title || `Board ${this.generateString(8)}`;
    board.description = overrides.description || this.generateString(50);
    board.ownerId = overrides.ownerId || this.generateId();
    board.isArchived = overrides.isArchived ?? false;
    board.createdAt = overrides.createdAt || new Date();
    board.updatedAt = overrides.updatedAt || new Date();

    return Object.assign(board, overrides);
  }

  static create(overrides: Partial<Board> = {}): Board {
    return new BoardFixture().build(overrides);
  }

  static createList(count: number, overrides: Partial<Board> = {}): Board[] {
    return new BoardFixture().buildList(count, overrides);
  }

  static async createAndSave(
    manager: EntityManager,
    overrides: Partial<Board> = {},
  ): Promise<Board> {
    const board = BoardFixture.create(overrides);
    return manager.save(Board, board);
  }
}
```

### Usage in Tests

```typescript
// Create in-memory board (no database)
const board = BoardFixture.create({ title: 'My Board' });

// Create multiple boards
const boards = BoardFixture.createList(5);

// Create and save to database
const savedBoard = await BoardFixture.createAndSave(manager, {
  title: 'Saved Board',
});
```

## Database Testing

### Transaction-Based Isolation

```typescript
import { DatabaseHelper } from '@test/helpers/database.helper';

describe('MyTest', () => {
  let dbHelper: DatabaseHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseHelper(module);
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    // Start transaction: all DB operations happen within transaction
    await dbHelper.startTransaction();
  });

  afterEach(async () => {
    // Rollback transaction: automatically cleans up all test data
    await dbHelper.rollbackTransaction();
  });

  it('test case', async () => {
    // Any database changes here are automatically rolled back
  });
});
```

### Benefits

✅ **Fast**: No need to truncate tables  
✅ **Isolated**: Tests don't interfere with each other  
✅ **Clean**: No leftover test data  
✅ **Reliable**: Consistent database state

## Mocking Strategies

### Mocking Dependencies

```typescript
// Mock interface implementation
const mockRepository: jest.Mocked<IBoardRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

// Configure mock behavior
mockRepository.findById.mockResolvedValue(board);
mockRepository.save.mockImplementation(async (board) => board);
```

### Spy on Methods

```typescript
// Spy on existing method
const spy = jest.spyOn(service, 'findById');

// Call method
await service.findById('123');

// Verify spy was called
expect(spy).toHaveBeenCalledWith('123');

// Restore original implementation
spy.mockRestore();
```

### Partial Mocks

```typescript
// Mock only specific methods
const module = await Test.createTestingModule({
  providers: [
    BoardService,
    {
      provide: BoardRepository,
      useValue: {
        ...new BoardRepository(),
        findById: jest.fn().mockResolvedValue(board),
      },
    },
  ],
}).compile();
```

## Code Coverage

### Coverage Thresholds

**Configuration**: `jest.config.js`

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/domain/': {
      branches: 90, // Higher threshold for core business logic
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Metrics

- **Lines**: % of lines executed
- **Statements**: % of statements executed
- **Branches**: % of if/else branches executed
- **Functions**: % of functions called

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test board.service.spec.ts

# Run tests in watch mode (TDD)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run only unit tests
npm test -- test/unit

# Run only integration tests
npm test -- test/integration

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run lint
```

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive, clear intent
describe('BoardService', () => {
  describe('create', () => {
    it('should create a board with valid input', () => {});
    it('should throw ValidationException for empty title', () => {});
    it('should assign owner ID from authenticated user', () => {});
  });
});

// ❌ Bad: Vague, unclear
describe('test', () => {
  it('works', () => {});
  it('test2', () => {});
});
```

### 2. Test Independence

```typescript
// ✅ Good: Each test is self-contained
it('test A', () => {
  const data = createTestData();
  // test with data
});

it('test B', () => {
  const data = createTestData();
  // test with data
});

// ❌ Bad: Tests depend on execution order
let sharedData;
it('test A', () => {
  sharedData = createTestData();
});
it('test B', () => {
  // depends on test A running first
  expect(sharedData).toBeDefined();
});
```

### 3. One Assertion Per Test (Guideline)

```typescript
// ✅ Good: Focused, clear failure message
it('should set correct title', () => {
  expect(result.title).toBe('My Board');
});

it('should set correct owner', () => {
  expect(result.ownerId).toBe(userId);
});

// ⚠️ Acceptable: Related assertions
it('should create board with all required fields', () => {
  expect(result.id).toBeDefined();
  expect(result.title).toBe('My Board');
  expect(result.ownerId).toBe(userId);
  expect(result.createdAt).toBeInstanceOf(Date);
});
```

### 4. Avoid Logic in Tests

```typescript
// ✅ Good: Direct assertions
it('should return first 3 boards', () => {
  expect(result).toHaveLength(3);
  expect(result[0].title).toBe('Board 1');
});

// ❌ Bad: Complex logic in test
it('should return first 3 boards', () => {
  for (let i = 0; i < result.length; i++) {
    if (i < 3) {
      expect(result[i]).toBeDefined();
    }
  }
});
```

## Related Documentation

- [Architecture Guide](./architecture.md) - System structure
- [API Documentation](./api.md) - Endpoint testing
- [Performance Guide](./performance.md) - Performance testing

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [Test-Driven Development (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
