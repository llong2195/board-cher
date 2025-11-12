# Performance Guide

**Last Updated**: 2025-11-06  
**Version**: 1.0.0  
**Target**: 1000 req/s sustained, API p95 <200ms

## Overview

This guide documents performance optimization strategies, monitoring approaches, and best practices for the Trello Vibe backend. Our performance goals ensure a responsive user experience under production load.

## Table of Contents

- [Performance Goals](#performance-goals)
- [Database Optimization](#database-optimization)
- [Caching Strategy](#caching-strategy)
- [Query Optimization](#query-optimization)
- [Connection Pooling](#connection-pooling)
- [WebSocket Scaling](#websocket-scaling)
- [Load Testing](#load-testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Performance Goals

### Target Metrics

| Metric                | Target               | Critical  |
| --------------------- | -------------------- | --------- |
| **API Throughput**    | 1000 req/s sustained | 500 req/s |
| **API Latency (p50)** | <100ms               | <150ms    |
| **API Latency (p95)** | <200ms               | <300ms    |
| **API Latency (p99)** | <500ms               | <1000ms   |
| **Database Query**    | <50ms average        | <100ms    |
| **WebSocket Update**  | <1s end-to-end       | <3s       |
| **Memory Usage**      | <512MB per instance  | <1GB      |
| **CPU Usage**         | <70% average         | <90%      |

### Load Scenarios

1. **Baseline**: 100 concurrent users, 500 req/s
2. **Normal**: 500 concurrent users, 1000 req/s
3. **Peak**: 1000 concurrent users, 2000 req/s (burst)
4. **Stress**: 2000 concurrent users, 4000 req/s (failure point)

## Database Optimization

### Indexing Strategy

#### Existing Indexes

```sql
-- Primary keys (automatic B-tree indexes)
CREATE INDEX boards_pkey ON boards(id);
CREATE INDEX cards_pkey ON cards(id);
CREATE INDEX lists_pkey ON lists(id);
CREATE INDEX users_pkey ON users(id);

-- Foreign key indexes (from migrations)
CREATE INDEX idx_boards_owner_id ON boards(owner_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_assigned_user_id ON cards(assigned_user_id);
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_comments_card_id ON comments(card_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_activities_board_id ON activities(board_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);

-- Composite indexes for common queries
CREATE INDEX idx_cards_list_position ON cards(list_id, position);
CREATE INDEX idx_boards_owner_archived ON boards(owner_id, is_archived);
CREATE INDEX idx_activities_board_created ON activities(board_id, created_at DESC);
```

#### Adding New Indexes

```typescript
// Migration: 1730900100000-AddCardSearchIndex.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardSearchIndex1730900100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GIN index for full-text search on card titles
    await queryRunner.query(`
      CREATE INDEX idx_cards_title_search 
      ON cards 
      USING GIN (to_tsvector('english', title))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_cards_title_search`);
  }
}
```

### Query Analysis with EXPLAIN

#### Identifying Slow Queries

```typescript
import { DataSource } from 'typeorm';

export class QueryAnalyzer {
  constructor(private readonly dataSource: DataSource) {}

  async analyzeQuery(sql: string, params: any[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Run EXPLAIN ANALYZE to get query plan and execution time
      const result = await queryRunner.query(
        `EXPLAIN (ANALYZE, BUFFERS, VERBOSE) ${sql}`,
        params,
      );

      console.log('Query Plan:', result);

      // Look for:
      // - Seq Scan (should be Index Scan for large tables)
      // - High execution time (>50ms)
      // - High buffer reads
    } finally {
      await queryRunner.release();
    }
  }
}
```

#### Example: Optimizing Board Lookup

```sql
-- ❌ Bad: Sequential scan on large table
EXPLAIN ANALYZE
SELECT * FROM boards
WHERE owner_id = 'user-123'
AND is_archived = false;

-- Query Plan:
-- Seq Scan on boards  (cost=0.00..1234.00 rows=100 width=500) (actual time=45.123..89.456 rows=10 loops=1)
--   Filter: (owner_id = 'user-123' AND is_archived = false)

-- ✅ Good: Index scan with composite index
CREATE INDEX idx_boards_owner_archived ON boards(owner_id, is_archived);

EXPLAIN ANALYZE
SELECT * FROM boards
WHERE owner_id = 'user-123'
AND is_archived = false;

-- Query Plan:
-- Index Scan using idx_boards_owner_archived on boards  (cost=0.15..8.17 rows=10 width=500) (actual time=0.123..1.456 rows=10 loops=1)
--   Index Cond: (owner_id = 'user-123' AND is_archived = false)
```

### Preventing N+1 Queries

#### Problem: N+1 Query

```typescript
// ❌ Bad: N+1 queries (1 query for boards + N queries for lists)
async getBoardsWithLists(userId: string): Promise<Board[]> {
  const boards = await this.boardRepository.find({
    where: { ownerId: userId }
  });

  // Triggers N separate queries for lists
  for (const board of boards) {
    await board.lists; // Lazy loading
  }

  return boards;
}

// SQL generated:
// SELECT * FROM boards WHERE owner_id = 'user-123';  -- 1 query
// SELECT * FROM lists WHERE board_id = 'board-1';     -- N queries
// SELECT * FROM lists WHERE board_id = 'board-2';
// ...
```

#### Solution: Eager Loading

```typescript
// ✅ Good: Single query with JOIN
async getBoardsWithLists(userId: string): Promise<Board[]> {
  return this.boardRepository.find({
    where: { ownerId: userId },
    relations: ['lists', 'lists.cards'], // Eager load
  });
}

// SQL generated:
// SELECT boards.*, lists.*, cards.*
// FROM boards
// LEFT JOIN lists ON lists.board_id = boards.id
// LEFT JOIN cards ON cards.list_id = lists.id
// WHERE boards.owner_id = 'user-123';  -- Single query
```

#### Solution: DataLoader Pattern

```typescript
import DataLoader from 'dataloader';

export class ListDataLoader {
  private loader: DataLoader<string, List[]>;

  constructor(private readonly listRepository: IListRepository) {
    this.loader = new DataLoader<string, List[]>(
      async (boardIds: readonly string[]) => {
        // Batch load lists for multiple boards in single query
        const lists = await this.listRepository.findByBoardIds([...boardIds]);

        // Group lists by board ID
        const listsByBoardId = new Map<string, List[]>();
        for (const list of lists) {
          const boardLists = listsByBoardId.get(list.boardId) || [];
          boardLists.push(list);
          listsByBoardId.set(list.boardId, boardLists);
        }

        // Return in same order as input
        return boardIds.map((id) => listsByBoardId.get(id) || []);
      },
    );
  }

  async loadListsForBoard(boardId: string): Promise<List[]> {
    return this.loader.load(boardId);
  }
}
```

## Caching Strategy

### Cache Layers

```text
┌─────────────────────────────────────────────┐
│ L1: In-Memory Cache (Node.js)              │
│ • TTL: 30 seconds                          │
│ • Scope: Single instance                   │
│ • Use: Frequent reads (user profile)      │
└──────────────────┬──────────────────────────┘
                   │ miss
┌──────────────────▼──────────────────────────┐
│ L2: Redis Cache (Shared)                   │
│ • TTL: 5-15 minutes                        │
│ • Scope: All instances                     │
│ • Use: Session data, board metadata        │
└──────────────────┬──────────────────────────┘
                   │ miss
┌──────────────────▼──────────────────────────┐
│ L3: PostgreSQL Database                    │
│ • Source of truth                          │
│ • Always consistent                        │
└─────────────────────────────────────────────┘
```

### Redis Configuration

```typescript
// src/infrastructure/cache/redis-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache GET failed for key ${key}`, error);
      return null; // Graceful degradation
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache SET failed for key ${key}`, error);
      // Don't throw - caching is not critical
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache DEL failed for key ${key}`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache DEL pattern failed for ${pattern}`, error);
    }
  }
}
```

### Caching Patterns

#### Cache-Aside Pattern

```typescript
@Injectable()
export class BoardService {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async findById(id: string): Promise<Board> {
    const cacheKey = `board:${id}`;

    // Try L2 cache first
    const cached = await this.cacheService.get<Board>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss: Load from database
    const board = await this.boardRepository.findById(id);
    if (!board) {
      throw new NotFoundException('Board', id);
    }

    // Update cache
    await this.cacheService.set(cacheKey, board, 300); // 5 min TTL

    return board;
  }

  async update(id: string, dto: UpdateBoardDto): Promise<Board> {
    const board = await this.findById(id);

    // Update database
    Object.assign(board, dto);
    const updated = await this.boardRepository.save(board);

    // Invalidate cache
    await this.cacheService.del(`board:${id}`);
    await this.cacheService.delPattern(`boards:owner:${board.ownerId}:*`);

    return updated;
  }
}
```

#### Cache TTL Recommendations

| Data Type      | TTL    | Rationale                                  |
| -------------- | ------ | ------------------------------------------ |
| User profile   | 15 min | Rarely changes, high read frequency        |
| Board metadata | 5 min  | Moderate changes, high read frequency      |
| Board lists    | 2 min  | Frequent reordering                        |
| Card details   | 1 min  | Very frequent updates                      |
| Activity feed  | 30 sec | Real-time feel, but cached for performance |
| Search results | 5 min  | Expensive queries, acceptable staleness    |

## Connection Pooling

### PostgreSQL Configuration

```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Connection pooling
  poolSize: 20, // Max active connections
  extra: {
    // Pool settings for pg driver
    max: 20, // Maximum pool size
    min: 5, // Minimum pool size (keep warm connections)
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout for acquiring connection

    // Query timeout
    statement_timeout: 10000, // Kill queries running >10s

    // Keep-alive to prevent connection drops
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },

  // Logging
  logging: process.env.NODE_ENV === 'development',
  logger: 'advanced-console',

  // Retry on connection failure
  retryAttempts: 3,
  retryDelay: 3000,
};
```

### Monitoring Pool Health

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async checkPoolHealth(): Promise<void> {
    const driver = this.dataSource.driver as any;
    const pool = driver.master;

    this.logger.log({
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    });

    // Alert if pool is exhausted
    if (pool.waitingCount > 5) {
      this.logger.warn(
        'Connection pool exhausted! Consider increasing pool size.',
      );
    }
  }
}
```

## WebSocket Scaling

### Redis Adapter Configuration

```typescript
// src/infrastructure/websocket/socket.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  transports: ['websocket', 'polling'],
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  async afterInit() {
    // Create Redis clients for pub/sub
    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Use Redis adapter for multi-instance scaling
    this.server.adapter(createAdapter(pubClient, subClient));
  }

  emitToBoard(boardId: string, event: string, data: any): void {
    // Event is broadcast to all instances via Redis pub/sub
    this.server.to(`board:${boardId}`).emit(event, data);
  }
}
```

### Room Management

```typescript
@SubscribeMessage('joinBoard')
async handleJoinBoard(
  @ConnectedSocket() client: Socket,
  @MessageBody() boardId: string,
): Promise<void> {
  // Join room for board updates
  await client.join(`board:${boardId}`);

  // Track active users
  await this.redis.sadd(`board:${boardId}:users`, client.data.userId);
  await this.redis.expire(`board:${boardId}:users`, 3600);
}

@SubscribeMessage('leaveBoard')
async handleLeaveBoard(
  @ConnectedSocket() client: Socket,
  @MessageBody() boardId: string,
): Promise<void> {
  await client.leave(`board:${boardId}`);
  await this.redis.srem(`board:${boardId}:users`, client.data.userId);
}
```

## Load Testing

### Autocannon Setup

```bash
# Install autocannon
npm install -D autocannon

# Run load test
npx autocannon \
  --connections 100 \
  --duration 30 \
  --amount 10000 \
  --method POST \
  --headers "Authorization=Bearer $JWT_TOKEN" \
  --body '{"title":"Load Test Board"}' \
  http://localhost:3000/boards
```

### Load Test Scripts

```typescript
// scripts/load-test.ts
import autocannon from 'autocannon';

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100, // Concurrent connections
    duration: 30, // Test duration in seconds
    pipelining: 1, // Requests per connection
    requests: [
      {
        method: 'GET',
        path: '/boards',
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
        },
      },
      {
        method: 'POST',
        path: '/cards',
        headers: {
          Authorization: `Bearer ${process.env.TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Load Test Card',
          listId: 'test-list-id',
        }),
      },
    ],
  });

  console.log('Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.requests.average} req/s`);
  console.log(`Latency p50: ${result.latency.p50}ms`);
  console.log(`Latency p95: ${result.latency.p95}ms`);
  console.log(`Latency p99: ${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);

  // Fail if performance goals not met
  if (result.latency.p95 > 200) {
    throw new Error(
      `Performance regression: p95 latency ${result.latency.p95}ms exceeds 200ms target`,
    );
  }
}

runLoadTest().catch(console.error);
```

### CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Test
on:
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: sleep 10 # Wait for server to start
      - run: npm run test:load
```

## Monitoring

### Prometheus Metrics

```typescript
// src/infrastructure/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly dbQueryDuration: Histogram;

  constructor() {
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_ms',
      help: 'Duration of database queries in ms',
      labelNames: ['query_type'],
      buckets: [1, 5, 10, 25, 50, 100, 250],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(durationMs);
    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  }

  recordDbQuery(queryType: string, durationMs: number): void {
    this.dbQueryDuration.labels(queryType).observe(durationMs);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
```

### Metrics Endpoint

```typescript
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiExcludeEndpoint()
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
```

## Troubleshooting

### Slow Queries

```bash
# Enable slow query logging in PostgreSQL
# postgresql.conf:
log_min_duration_statement = 100  # Log queries >100ms

# View slow queries
tail -f /var/log/postgresql/postgresql-15-main.log | grep "duration:"
```

### High Memory Usage

```typescript
// Check for memory leaks
import v8 from 'v8';
import { writeFileSync } from 'fs';

export function takeHeapSnapshot(): void {
  const filename = `heap-${Date.now()}.heapsnapshot`;
  const snapshot = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot saved to ${snapshot}`);
}

// Analyze with Chrome DevTools
```

### Connection Pool Exhaustion

```sql
-- Check active connections
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query,
  state_change
FROM pg_stat_activity
WHERE datname = 'trello_vibe'
ORDER BY state_change DESC;

-- Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
```

## Related Documentation

- [Architecture Guide](./architecture.md) - System design
- [API Documentation](./api.md) - Endpoint specifications
- [Testing Guide](./testing.md) - Performance testing

## References

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [Autocannon Load Testing](https://github.com/mcollina/autocannon)
