# Research: Collaborative Kanban Board Application

**Feature**: 001-kanban-board  
**Date**: 2025-10-31  
**Phase**: 0 - Outline & Research

## Research Tasks

This document consolidates research findings for key technical decisions and best practices.

---

## 1. NestJS + Domain-Driven Design (DDD) Architecture

### Decision
Use NestJS with layered DDD architecture: Domain → Application → Infrastructure → Presentation

### Rationale
- **NestJS**: Mature enterprise framework with built-in support for TypeScript, dependency injection, modules, guards, and decorators. Excellent for CQRS and event-driven architecture.
- **DDD Layers**: Clear separation of business logic (domain) from infrastructure concerns enables testability, maintainability, and adherence to SOLID principles.
- **Aggregates**: Board and Card as aggregate roots with strong consistency boundaries. List and Comment as entities within aggregates.
- **Domain Events**: Enable audit logging, real-time notifications, and eventual consistency patterns.

### Alternatives Considered
- **Express.js**: Too low-level, requires manual DI and architecture setup
- **Fastify**: Faster but less opinionated, lacks mature DDD ecosystem
- **Clean Architecture**: Similar to DDD but DDD provides richer tactical patterns for complex domains

### Implementation Notes
- Use NestJS modules to represent bounded contexts (UserModule, BoardModule, etc.)
- Implement repository pattern in infrastructure layer with TypeORM
- Use command/query handlers (CQRS) in application layer
- Domain layer contains pure business logic with no framework dependencies

---

## 2. TypeORM with SQLite (Dev) and PostgreSQL (Prod)

### Decision
Use TypeORM as ORM with SQLite for development and PostgreSQL for production

### Rationale
- **TypeORM**: Official NestJS integration, supports multiple databases, migration system, repository pattern
- **SQLite Dev**: Zero-config local development, file-based storage, fast iteration
- **PostgreSQL Prod**: ACID compliance, rich indexing, JSON support, horizontal scaling with read replicas
- **Database Agnostic**: TypeORM abstracts SQL dialect differences, making switch seamless

### Alternatives Considered
- **Prisma**: Modern but less mature TypeORM integration with NestJS; migration story less flexible
- **Sequelize**: Older, callback-based API, less TypeScript support
- **MongoDB**: NoSQL doesn't fit relational data model (boards → lists → cards hierarchy)

### Implementation Notes
- Use TypeORM entities in infrastructure layer as persistence models
- Map between domain entities and TypeORM entities in repository implementations
- Create indexes on foreign keys, position fields, and timestamp columns
- Use migrations for schema versioning
- Configure connection pooling: min 5, max 20 connections

---

## 3. Redis for Caching and Pub/Sub

### Decision
Use ioredis client with Redis for caching and Socket.io pub/sub scaling

### Rationale
- **Caching**: Store frequently accessed boards, user sessions, rate limit counters
- **Pub/Sub**: Enable WebSocket message broadcasting across multiple backend instances
- **Performance**: In-memory speed (sub-millisecond latency) for hot data
- **Atomic Operations**: Rate limiting with INCR/EXPIRE commands

### Alternatives Considered
- **Memcached**: No pub/sub support, limited data structures
- **In-Memory Cache**: Doesn't scale across multiple instances
- **Database Caching**: Too slow for real-time requirements

### Implementation Notes
- Cache keys: `board:{id}`, `user:session:{token}`, `ratelimit:{userId}:{endpoint}`
- TTL strategy: Boards (5min), Sessions (15min refresh), Rate limits (1min window)
- Redis adapter for Socket.io: `@socket.io/redis-adapter`
- Invalidation: On domain events (BoardUpdated, CardMoved, etc.)

---

## 4. Real-time Architecture with Socket.io

### Decision
Use Socket.io for WebSocket communication with Redis adapter for scaling

### Rationale
- **Socket.io**: Automatic reconnection, fallback to polling, room-based broadcasting, TypeScript support
- **Redis Adapter**: Enables horizontal scaling by synchronizing events across multiple server instances
- **Room Pattern**: Each board is a room; users join/leave rooms dynamically
- **Optimistic Updates**: Client immediately reflects changes, server broadcasts confirmation

### Alternatives Considered
- **Native WebSocket (ws)**: Lower-level, requires manual reconnection and room logic
- **Server-Sent Events (SSE)**: Unidirectional, doesn't support binary data
- **GraphQL Subscriptions**: Overhead of GraphQL layer when REST already used

### Implementation Notes
- Gateway in infrastructure layer: `BoardGateway`, `CardGateway`
- Events: `board:join`, `board:leave`, `card:created`, `card:updated`, `card:moved`, `list:created`
- Authentication: Verify JWT token in handshake middleware
- Rate limiting: 100 events/min per connection
- Heartbeat: 30s ping/pong to detect dead connections

---

## 5. React + TypeScript + shadcn/ui Frontend

### Decision
Use React 18 with TypeScript, Vite build tool, and shadcn/ui component library

### Rationale
- **React 18**: Concurrent rendering, automatic batching, streaming SSR capability
- **TypeScript**: Type safety across frontend/backend via shared types package
- **Vite**: Fast dev server with HMR, optimized production builds
- **shadcn/ui**: Copy-paste components (not NPM dependency), Radix UI primitives, Tailwind CSS, full customization

### Alternatives Considered
- **Next.js**: Overkill for SPA, SSR not required for authenticated app
- **Vue**: Less ecosystem support for TypeScript and DDD patterns
- **Angular**: Too heavy, steep learning curve
- **Material-UI/Ant Design**: Larger bundle size, harder to customize

### Implementation Notes
- State management: Zustand for global state (user, auth), React Query for server state
- Drag-and-drop: @dnd-kit/core (modern, accessible, touch-friendly)
- Form validation: React Hook Form + Zod (shared with backend)
- Routing: React Router v6
- WebSocket client: socket.io-client with reconnection logic

---

## 6. Authentication with JWT + Refresh Tokens

### Decision
Implement JWT access tokens (15min) + refresh tokens (7 days) with rotation

### Rationale
- **Stateless Access Tokens**: Enable horizontal scaling, no session store lookups
- **Short-Lived Access Tokens**: Limit damage if token compromised
- **Refresh Token Rotation**: Security best practice, invalidates old refresh tokens
- **HttpOnly Cookies**: Protect refresh tokens from XSS attacks

### Alternatives Considered
- **Session-Based**: Requires sticky sessions or centralized session store, doesn't scale as well
- **OAuth2 Only**: Overkill for internal auth, added complexity
- **Longer JWT Expiry**: Security risk if token leaked

### Implementation Notes
- Access token in Authorization header: `Bearer <token>`
- Refresh token in HttpOnly, Secure, SameSite cookie
- Refresh endpoint: `/auth/refresh` (validates refresh token, returns new access + refresh tokens)
- Blacklist refresh tokens in Redis on logout
- JWT payload: `{ sub: userId, email, roles: [] }`

---

## 7. Role-Based Access Control (RBAC)

### Decision
Implement 4-tier RBAC: Owner, Admin, Member, Guest at organization and board levels

### Rationale
- **Organization Scope**: Controls who can manage members and create boards
- **Board Scope**: Controls who can view/edit specific board content
- **Granular Permissions**: Supports enterprise use cases (contractors as guests)
- **NestJS Guards**: Built-in support for role checking via custom decorators

### Alternatives Considered
- **Attribute-Based Access Control (ABAC)**: Too complex for MVP requirements
- **Single-Level Permissions**: Insufficient granularity for organizations
- **Resource-Level Permissions**: Too fine-grained (per-card permissions), impacts performance

### Implementation Notes
- Permission entity: `{ userId, resourceType, resourceId, role }`
- Guards: `@RequireRole('admin')`, `@RequireBoardAccess('member')`
- Middleware: Check permissions before WebSocket broadcasts
- Cache permissions in Redis: `permissions:{userId}:{boardId}`

---

## 8. File Attachment Storage

### Decision
Store file metadata in database, files in local filesystem (dev), migrate to S3 (prod)

### Rationale
- **Metadata in DB**: Enable queries, validation, permissions checking
- **Local Storage (Dev)**: Simple setup, no cloud dependencies
- **S3-Compatible (Prod)**: Scalable, durable, CDN integration, presigned URLs
- **Decoupled Storage**: Easy to swap implementations via interface

### Alternatives Considered
- **Database BLOBs**: Poor performance, bloats database backups
- **Direct S3 Upload**: Client needs AWS credentials, harder to validate
- **Third-Party Service (Cloudinary)**: Vendor lock-in, additional cost

### Implementation Notes
- Storage interface: `IFileStorage` with implementations `LocalFileStorage`, `S3FileStorage`
- Upload flow: Client → Backend (validates) → Storage → Return metadata
- File size limit: 10MB enforced in backend
- Virus scanning: Optional integration with ClamAV in future

---

## 9. Testing Strategy

### Decision
Multi-layered testing: Unit (80%), Integration (API, DB, WebSocket), E2E (critical paths)

### Rationale
- **Unit Tests**: Fast feedback, test business logic in isolation (domain entities, services)
- **Integration Tests**: Verify component interactions (repositories, API endpoints, WebSocket events)
- **E2E Tests**: Validate critical user journeys end-to-end
- **Performance Tests**: Validate 1000 req/s target with load testing tools

### Test Tools
- **Backend**: Jest, NestJS Testing Module, Supertest (API), ioredis-mock (Redis), sqlite3 (in-memory)
- **Frontend**: Vitest, React Testing Library, MSW (API mocking), Playwright (E2E)
- **Load Testing**: k6 or Artillery for performance testing

### Implementation Notes
- Test database: SQLite in-memory for isolation
- Fixtures: Factory pattern for test data generation
- Test structure: Arrange-Act-Assert pattern
- CI/CD: Run tests on every commit, fail pipeline if coverage <80%

---

## 10. Performance Optimization Strategies

### Decision
Multi-pronged approach: Caching, indexing, pagination, connection pooling, load balancing

### Rationale
To achieve 1000 req/s target with <200ms p95 latency:

1. **Database Optimization**
   - Index foreign keys: `board_id`, `list_id`, `user_id`
   - Index position columns for ordering queries
   - Index timestamps for activity queries
   - Connection pooling: Reuse connections, avoid handshake overhead

2. **Caching Strategy**
   - Redis caching for frequently read data (boards, users)
   - Cache-aside pattern: Check cache → Miss → Query DB → Store in cache
   - Invalidation on domain events

3. **Query Optimization**
   - Use eager loading (`relations: ['lists', 'cards']`) to avoid N+1 queries
   - Cursor-based pagination for large lists
   - Projection queries: Select only needed fields

4. **API Optimization**
   - Compression: gzip middleware for responses
   - Rate limiting: Prevent abuse, protect resources
   - Request validation: Fail fast on invalid inputs

5. **Frontend Optimization**
   - Code splitting: Lazy load routes
   - Virtual scrolling: Render only visible cards
   - Optimistic updates: Instant UI feedback
   - Debounce: Throttle search/filter queries

6. **WebSocket Optimization**
   - Room-based broadcasting: Only send to relevant clients
   - Message batching: Combine multiple updates
   - Binary protocol: More efficient than JSON for large payloads

### Load Balancing
- Nginx reverse proxy with round-robin
- Stateless API design: Any instance can handle any request
- Redis pub/sub: Synchronize WebSocket events across instances

---

## 11. Security Best Practices

### Decision
Implement defense-in-depth: Input validation, parameterized queries, rate limiting, CORS, CSP, Helmet

### Rationale
Security must be built-in from the start, not added later

### Security Measures

1. **Input Validation**
   - Class-validator decorators on DTOs
   - Zod schemas for runtime validation
   - Whitelist approach: Explicitly define allowed fields

2. **SQL Injection Prevention**
   - TypeORM parameterized queries (never concatenate SQL)
   - DTO validation prevents malicious input reaching queries

3. **XSS Protection**
   - React auto-escapes by default
   - Sanitize HTML in rich text fields (DOMPurify)
   - Content-Security-Policy headers

4. **CSRF Protection**
   - SameSite cookies for refresh tokens
   - CORS whitelist for API endpoints

5. **Rate Limiting**
   - Per-user and per-IP limits
   - Redis-backed rate limiter: @nestjs/throttler

6. **Secrets Management**
   - Environment variables for sensitive config
   - Never commit secrets to Git
   - Separate .env files for dev/prod

7. **Dependencies**
   - Automated scanning: npm audit, Snyk
   - Keep dependencies updated
   - Review security advisories

### Implementation Notes
- Helmet.js: Security headers (HSTS, X-Frame-Options, etc.)
- CORS: Whitelist frontend origin only
- JWT secret: 256-bit random key, rotate periodically
- Bcrypt: Hash passwords with salt rounds = 12

---

## Summary of Key Decisions

| Area | Technology | Rationale |
|------|------------|-----------|
| Backend Framework | NestJS | DDD support, DI, modules, TypeScript-first |
| ORM | TypeORM | NestJS integration, migrations, multi-DB |
| Database | SQLite (dev), PostgreSQL (prod) | Zero-config dev, scalable prod |
| Caching | Redis (ioredis) | Sub-ms latency, pub/sub for WebSocket |
| Real-time | Socket.io | Reconnection, rooms, Redis adapter |
| Frontend | React + TypeScript | Component model, type safety |
| UI Library | shadcn/ui | Customizable, Radix primitives, Tailwind |
| Build Tool | Vite | Fast HMR, optimized builds |
| Auth | JWT + Refresh Tokens | Stateless, secure, scalable |
| Testing | Jest + Vitest | Fast, widely adopted, good DX |
| Monorepo | pnpm workspaces | Fast, efficient, shared deps |

---

## Next Steps (Phase 1)

1. Generate detailed data model with entities, relationships, and migrations
2. Create OpenAPI specification for REST endpoints
3. Document WebSocket events and payloads
4. Create quickstart guide for local development setup
5. Update agent context with technologies chosen
