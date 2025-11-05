# Architecture Documentation

## Overview

Trello Vibe is a collaborative Kanban board application built with modern web technologies. This document provides a comprehensive overview of the system architecture, design decisions, and implementation patterns.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui   │
│  - React Query for data fetching                            │
│  - Zustand for state management                             │
│  - React DnD for drag-and-drop                              │
│  - Socket.io client for real-time updates                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/WSS
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                         Backend                             │
│        NestJS 10 + TypeScript + TypeORM + Socket.io        │
│  - Domain-Driven Design (DDD)                               │
│  - CQRS pattern for commands/queries                        │
│  - JWT authentication                                        │
│  - Redis for caching and rate limiting                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────┴────────┐          ┌─────────┴────────┐
│   PostgreSQL   │          │      Redis       │
│   (Primary DB) │          │ (Cache & Queue)  │
└────────────────┘          └──────────────────┘
```

## Backend Architecture

### Directory Structure

```
packages/backend/
├── src/
│   ├── application/          # Application layer (CQRS)
│   │   ├── commands/         # Command handlers (write operations)
│   │   ├── queries/          # Query handlers (read operations)
│   │   └── services/         # Application services
│   │
│   ├── domain/               # Domain layer (business logic)
│   │   ├── board/            # Board aggregate
│   │   ├── card/             # Card aggregate
│   │   ├── list/             # List aggregate
│   │   ├── organization/     # Organization aggregate
│   │   └── user/             # User aggregate
│   │
│   ├── infrastructure/       # Infrastructure layer
│   │   ├── auth/             # Authentication & authorization
│   │   ├── database/         # Database configuration
│   │   ├── logging/          # Logging services
│   │   ├── persistence/      # TypeORM entities & repositories
│   │   └── websocket/        # WebSocket gateway
│   │
│   ├── presentation/         # Presentation layer
│   │   ├── controllers/      # REST API controllers
│   │   ├── dto/              # Data Transfer Objects
│   │   └── filters/          # Exception filters
│   │
│   └── config/               # Configuration modules
│
├── migrations/               # Database migrations
└── test/                     # Tests
    ├── unit/                 # Unit tests
    ├── integration/          # Integration tests
    ├── e2e/                  # End-to-end tests
    └── performance/          # Performance tests (k6)
```

### Design Patterns

#### 1. Domain-Driven Design (DDD)

The application follows DDD principles with clear separation between:

- **Domain Layer**: Pure business logic and models
- **Application Layer**: Use cases and orchestration
- **Infrastructure Layer**: External dependencies and implementations
- **Presentation Layer**: API endpoints and DTOs

#### 2. CQRS (Command Query Responsibility Segregation)

Separates read and write operations:

- **Commands**: Mutate state (Create, Update, Delete)
- **Queries**: Read state without modification (Get, List, Search)

Example:

```typescript
// Command
CreateBoardCommand → CreateBoardHandler → BoardRepository.save()

// Query
GetBoardQuery → GetBoardHandler → BoardRepository.findById()
```

#### 3. Repository Pattern

Abstracts data access with interfaces:

```typescript
interface IBoardRepository {
  findById(id: string): Promise<Board | null>;
  save(board: Board): Promise<Board>;
  delete(id: string): Promise<void>;
}
```

Implementation uses TypeORM with Redis caching layer.

#### 4. Dependency Injection

NestJS provides built-in DI container:

```typescript
@Injectable()
class BoardService {
  constructor(
    @Inject('IBoardRepository')
    private readonly boardRepository: IBoardRepository,
  ) {}
}
```

### Security Architecture

#### Authentication Flow

```
1. User logs in → POST /api/v1/auth/login
2. Server validates credentials
3. Server generates JWT token
4. Client stores token (localStorage/memory)
5. Client includes token in Authorization header
6. JwtAuthGuard validates token on each request
```

#### Authorization

Multi-level authorization:

1. **JWT Authentication** (`JwtAuthGuard`): Verifies user identity
2. **Board Permissions** (`BoardPermissionGuard`): Checks board-level access
3. **Organization Permissions** (`OrganizationPermissionGuard`): Checks org-level access

Role hierarchy:

- **OWNER**: Full control (create, update, delete, manage members)
- **ADMIN**: Manage content and members (cannot delete board)
- **MEMBER**: Read and write (cannot manage members)
- **VIEWER**: Read-only access

## Frontend Architecture

### State Management

#### Zustand Stores

```
stores/
├── auth.store.ts          # Authentication state
├── board.store.ts         # Board data and operations
├── search.store.ts        # Search filters and results
└── websocket.store.ts     # WebSocket connection status
```

#### React Query

Used for server state management:

- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Pagination support

### Component Structure

```
components/
├── ui/                    # Reusable UI components (shadcn/ui)
├── board/                 # Board-specific components
│   ├── Board.tsx
│   ├── List.tsx
│   └── Card.tsx
├── card/                  # Card detail components
├── search/                # Search and filter components
├── skeleton/              # Loading skeletons
├── error/                 # Error boundaries
└── help/                  # Help and documentation
```

### Real-Time Updates

WebSocket integration using Socket.io:

```typescript
// Client subscribes to board updates
socket.emit('join-board', { boardId });

// Server broadcasts events
socket.to(boardId).emit('card-moved', { cardId, listId });

// Client handles updates
socket.on('card-moved', (data) => {
  // Update local state
});
```

## Database Schema

### Core Entities

```sql
-- Organizations (multi-tenant)
organizations
  ├── id (PK)
  ├── name
  ├── slug (unique)
  └── created_at

-- Users
users
  ├── id (PK)
  ├── email (unique)
  ├── password_hash
  └── name

-- Boards
boards
  ├── id (PK)
  ├── organization_id (FK)
  ├── name
  ├── description
  └── color

-- Lists
lists
  ├── id (PK)
  ├── board_id (FK)
  ├── name
  └── position (for ordering)

-- Cards
cards
  ├── id (PK)
  ├── list_id (FK)
  ├── title
  ├── description
  ├── position (for ordering)
  └── due_date
```

### Relationships

- One Organization → Many Boards
- One Board → Many Lists
- One List → Many Cards
- Many-to-Many: Users ↔ Boards (BoardMembers)
- Many-to-Many: Users ↔ Organizations (OrganizationMembers)

## Performance Optimizations

### Backend

1. **Redis Caching**
   - Board queries cached for 5 minutes
   - Automatic cache invalidation on updates
   - Rate limiting using Redis

2. **Database Indexes**
   - Composite indexes on frequently queried columns
   - Full-text search indexes for card titles/descriptions

3. **Cursor-Based Pagination**
   - Efficient for large datasets
   - Avoids offset performance issues

### Frontend

1. **Virtual Scrolling**
   - React Virtual for long lists
   - Only renders visible cards

2. **Code Splitting**
   - Route-based lazy loading
   - Dynamic imports for heavy components

3. **Optimistic Updates**
   - Immediate UI feedback
   - Rollback on server error

## Testing Strategy

### Test Pyramid

```
           ┌────────────┐
           │    E2E     │  (Playwright - user journeys)
           │   Tests    │
           └────────────┘
         ┌──────────────────┐
         │   Integration    │  (API endpoints, DB)
         │     Tests        │
         └──────────────────┘
    ┌──────────────────────────┐
    │      Unit Tests          │  (Jest - services, utilities)
    │                          │
    └──────────────────────────┘
```

### Coverage Requirements

- **Overall**: ≥80% code coverage
- **Critical Paths**: ≥90% coverage
  - Authentication flow
  - Card movement
  - WebSocket events

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────┐
│              Load Balancer (Nginx)           │
└─────────┬─────────────────────┬──────────────┘
          │                     │
┌─────────┴─────────┐  ┌───────┴──────────┐
│  Frontend (CDN)   │  │  Backend (PM2)   │
│  Static Assets    │  │  Node.js Cluster │
└───────────────────┘  └───────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────┴────────┐          ┌────────┴───────┐
        │   PostgreSQL   │          │     Redis      │
        │   (Primary)    │          │   (Cluster)    │
        └────────────────┘          └────────────────┘
```

### Environment Variables

Required configuration:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=trello_vibe
DATABASE_USER=postgres
DATABASE_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=production
```

## API Design

### RESTful Principles

- Resource-based URLs: `/api/v1/boards/:id`
- HTTP methods: GET, POST, PUT, DELETE
- Status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found)

### OpenAPI Documentation

Available at `/api/docs` when server is running.

### Versioning

API versioned with prefix: `/api/v1/`

## Monitoring & Logging

### Logging Strategy

```typescript
logger.log('Info message'); // General information
logger.error('Error message'); // Errors and exceptions
logger.warn('Warning message'); // Warnings
logger.debug('Debug message'); // Debugging (dev only)
```

### Metrics

Key metrics to monitor:

- API response times (p95, p99)
- Database query times
- Cache hit rates
- WebSocket connection count
- Error rates

## Future Enhancements

### Planned Features

1. **Offline Support**
   - Service workers for offline capability
   - Local IndexedDB for offline data

2. **Advanced Search**
   - Elasticsearch integration
   - Fuzzy matching
   - Advanced filters

3. **File Attachments**
   - S3/MinIO for file storage
   - Image thumbnails
   - File previews

4. **Notifications**
   - Email notifications
   - Push notifications
   - In-app notification center

5. **Mobile Apps**
   - React Native applications
   - Native iOS/Android apps

## Contributing

See `contributing.md` for development workflow, coding standards, and pull request process.

## License

UNLICENSED - Proprietary software
