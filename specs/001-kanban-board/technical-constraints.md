# Technical Constraints and Implementation Guidance

**Feature**: Collaborative Kanban Board Application  
**Branch**: `001-kanban-board`  
**Created**: 2025-10-31

> **Note**: This document captures technical constraints and implementation preferences provided by the stakeholder. These are **inputs to the planning phase**, not part of the specification itself. The specification focuses on WHAT and WHY; this document provides guidance on HOW.

## Mandated Technology Stack

### Backend
- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: 
  - Development: SQLite
  - Production-ready: Design for PostgreSQL compatibility
- **Caching & Pub/Sub**: ioredis (Redis)
- **Real-time**: WebSocket (socket.io or ws)
- **Architecture**: Domain-Driven Design (DDD)
  - Bounded contexts
  - Aggregates
  - Repositories
  - Application services
  - Domain events

### Frontend
- **Framework**: React with TypeScript
- **Package Manager**: pnpm
- **Monorepo**: pnpm workspaces
- **UI Components**: shadcn/ui
- **Real-time**: WebSocket client

### Development Tooling
- **Monorepo**: pnpm workspaces
- **Containerization**: Dockerfile + docker-compose for local development
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest or Jest

### Authentication & Authorization
- **Method**: JWT with refresh tokens
- **Permissions**: Role-based access control (RBAC)
  - Owner: Full control
  - Admin: Manage users and boards
  - Member: Create and edit content
  - Guest: View-only access

## Performance Requirements

### Target Metrics
- **Throughput**: ~1000 requests/second sustained load
- **Scalability**: Horizontal scaling capability
- **Optimization Strategies**:
  - Caching layer (Redis)
  - Connection pooling
  - Efficient query design
  - Load balancing support

### Real-time Architecture
- **Protocol**: WebSocket for board/list/card updates
- **Scaling**: Redis pub/sub for multi-instance synchronization
- **Features**:
  - Board-level real-time collaboration
  - Broadcast updates to all connected users
  - Optimistic UI updates on frontend

## Persistence Layer

### Database Design
- **ORM**: TypeORM entities
- **Migrations**: Version-controlled database migrations
- **DDD Mapping**: Clear mapping between domain models and persistence
- **Database Agnostic**: Design to support both SQLite (dev) and PostgreSQL (prod) with minimal changes

## Feature Requirements (Technical View)

### Core Entities
- Users
- Organizations/Teams
- Boards
- Lists (columns)
- Cards
- Comments
- Attachments (file metadata; local storage acceptable)
- Labels
- Checklists
- Activity feed

### Collaboration Features
- Multi-user board access with real-time updates
- Change broadcasting across all connected clients
- Optimistic updates with rollback capability

### User Interface
- Drag & drop for lists and cards
- Card modal with:
  - Details
  - Comments
  - Attachments
  - History
  - Due date
  - Assignees
- Search and filtering:
  - By label
  - By assignee
  - By text content

### Performance Optimizations
- Pagination for board lists and large card lists
- Lazy loading for attachments
- Efficient real-time update mechanism

### System Features
- Audit logs using domain events
- Domain events for create/update/delete operations
- Rate limiting
- Input validation

## Project Structure

### Monorepo Layout
```
packages/
├── backend/      # NestJS application
├── frontend/     # React application
└── shared/       # Shared types and utilities
```

### Backend Structure (DDD)
```
packages/backend/
├── src/
│   ├── domain/              # Domain layer
│   │   ├── aggregates/      # Domain aggregates
│   │   ├── entities/        # Domain entities
│   │   ├── value-objects/   # Value objects
│   │   └── events/          # Domain events
│   ├── application/         # Application layer
│   │   ├── services/        # Application services
│   │   ├── commands/        # Command handlers
│   │   └── queries/         # Query handlers
│   ├── infrastructure/      # Infrastructure layer
│   │   ├── repositories/    # Repository implementations
│   │   ├── persistence/     # TypeORM entities & migrations
│   │   ├── cache/           # Redis integration
│   │   └── websocket/       # WebSocket implementation
│   └── presentation/        # Presentation layer
│       ├── controllers/     # REST controllers
│       └── gateways/        # WebSocket gateways
```

## Deliverables

### 1. Monorepo Skeleton
- Complete pnpm workspace configuration
- Package structure: backend, frontend, shared

### 2. Backend Implementation
- NestJS app with DDD folder structure
- TypeORM entities for core aggregates
- Repository pattern implementations
- Application services
- REST controllers
- WebSocket gateway
- Redis integration for caching and pub/sub
- Sample fixtures/seed data
- Unit tests for key services
- Integration tests for critical flows

### 3. Frontend Implementation
- React app with TypeScript
- shadcn/ui component integration
- Drag-and-drop board interface
- WebSocket client integration
- Pages:
  - Authentication (login/register)
  - Boards list
  - Board view (main kanban interface)
  - Card modal
- Responsive UI design

### 4. Development Environment
- Docker Compose configuration:
  - Backend service
  - Frontend service
  - Redis service
  - SQLite volume management

### 5. Documentation
- README with instructions:
  - Running locally
  - Building for production
  - Running tests
  - Deployment guidance
  - Performance tuning notes (how to reach 1000 req/s target)
- API documentation:
  - Postman collection OR OpenAPI specification
  - REST endpoints
  - WebSocket event examples

### 6. Development Scripts
- `pnpm install` - Install dependencies
- `pnpm dev:backend` - Run backend in development mode
- `pnpm dev:frontend` - Run frontend in development mode
- `pnpm build` - Build all packages for production
- `pnpm test` - Run test suites
- `pnpm lint` - Run linting checks

### 7. Sample Data
- SQL seed scripts for demo data
- Fixture data for testing

## Performance Tuning Guidance

### Strategies to Reach 1000 req/s Target

1. **Database Optimization**
   - Proper indexing on frequently queried fields
   - Connection pooling configuration
   - Query optimization using TypeORM query builder
   - Consider read replicas for read-heavy operations

2. **Caching Strategy**
   - Redis caching for frequently accessed data
   - Cache invalidation strategy aligned with domain events
   - Session storage in Redis
   - Rate limit counters in Redis

3. **Application Architecture**
   - Horizontal scaling readiness
   - Stateless application design
   - Load balancer configuration guidance
   - Health check endpoints

4. **Real-time Optimization**
   - Redis pub/sub for WebSocket scaling
   - Connection pooling for WebSocket connections
   - Efficient event broadcasting (room-based)
   - Backpressure handling

5. **Frontend Optimization**
   - Code splitting and lazy loading
   - Optimistic UI updates
   - Efficient re-rendering (React.memo, useMemo)
   - Virtual scrolling for large lists

6. **Infrastructure Recommendations**
   - Container orchestration (Kubernetes/Docker Swarm)
   - Reverse proxy (Nginx) configuration
   - CDN for static assets
   - Database replication setup

## Testing Requirements

### Backend Tests
- Unit tests for:
  - Domain entities and value objects
  - Application services
  - Repository implementations
- Integration tests for:
  - REST endpoints
  - WebSocket gateway
  - Database operations
  - Redis operations

### Frontend Tests
- Component tests
- Integration tests for key user flows
- E2E tests for critical paths (optional but recommended)

## Compliance & Security

### Security Measures
- JWT token security best practices
- Refresh token rotation
- Rate limiting per user/IP
- Input validation and sanitization
- SQL injection prevention (TypeORM parameterized queries)
- XSS protection
- CORS configuration
- Helmet.js security headers

### Audit & Monitoring
- Domain events for all state changes
- Activity log persistence
- Error tracking and logging
- Performance monitoring hooks

## Migration Path

### From SQLite to PostgreSQL
- Use TypeORM migrations
- Abstract SQL dialect differences
- Test against both databases in CI
- Document specific PostgreSQL optimizations
