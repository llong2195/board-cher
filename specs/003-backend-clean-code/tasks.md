# Tasks: Backend Clean Code & Architecture

**Feature**: 003-backend-clean-code  
**Date**: 2025-11-06  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/

**Tests**: NOT required for this refactoring feature - test tasks are included as separate implementation items to achieve 80%+ coverage target.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This refactoring maintains backward compatibility with zero API changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `packages/backend/src/`
- Tests: `packages/backend/test/`
- Documentation: `packages/backend/docs/`, `specs/003-backend-clean-code/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and developer tooling setup  
**Duration**: ~4 hours  
**Dependencies**: None

- [x] T001 Configure husky pre-commit hooks in `packages/backend/.husky/pre-commit` with lint-staged for ESLint and Prettier
- [x] T002 [P] Update ESLint config in `packages/backend/eslint.config.mjs` with complexity rules (max-complexity: 10, max-lines-per-function: 20)
- [x] T003 [P] Configure Jest coverage thresholds in `packages/backend/jest.config.js` (branches: 80, functions: 80, lines: 80, statements: 80)
- [x] T004 [P] Add performance testing tool (k6 or autocannon) to `packages/backend/package.json` devDependencies
- [x] T005 Generate OpenAPI baseline in `specs/003-backend-clean-code/contracts/openapi-baseline.json` by running `curl http://localhost:3000/api/docs-json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented  
**Duration**: ~8 hours  
**Dependencies**: Phase 1 complete

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create custom exception classes in `packages/backend/src/domain/shared/exceptions/` (ValidationException, NotFoundException, UnauthorizedException, ForbiddenException, ConflictException)
- [x] T007 [P] Implement global exception filter in `packages/backend/src/presentation/filters/global-exception.filter.ts` with structured error response format
- [x] T008 [P] Create base repository interface in `packages/backend/src/domain/shared/interfaces/repository.interface.ts` with generic CRUD methods
- [x] T009 [P] Configure ValidationPipe globally in `packages/backend/src/main.ts` (whitelist: true, forbidNonWhitelisted: true, transform: true)
- [x] T010 Create test fixtures base classes in `packages/backend/test/fixtures/base.fixture.ts` with factory pattern
- [x] T011 [P] Create test database helper in `packages/backend/test/helpers/database.helper.ts` with transaction rollback support
- [x] T012 [P] Configure domain events with NestJS EventEmitter in `packages/backend/src/app.module.ts` by importing EventEmitterModule
- [x] T013 Audit TypeScript config in `packages/backend/tsconfig.json` to verify strict mode, noImplicitAny, strictNullChecks enabled

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Maintainable Codebase (Priority: P1) 🎯 MVP

**Goal**: Improve code organization, documentation, and maintainability to reduce onboarding time from 8+ hours to 4 hours

**Independent Test**: New developer can implement a simple feature (add API endpoint) within 4 hours by following documentation

**Duration**: ~40 hours  
**Dependencies**: Phase 2 complete

### Documentation & Code Organization

- [x] T014 [P] [US1] Create architecture documentation in `packages/backend/docs/architecture.md` explaining DDD layers (domain, application, infrastructure, presentation)
- [x] T015 [P] [US1] Create API documentation guide in `packages/backend/docs/api.md` with OpenAPI/Swagger usage instructions
- [x] T016 [P] [US1] Create testing guide in `packages/backend/docs/testing.md` documenting unit, integration, and TDD workflow
- [x] T017 [P] [US1] Create performance guide in `packages/backend/docs/performance.md` with query optimization and caching strategies

### Module-Level Documentation

- [x] T018 [P] [US1] Add README.md to `packages/backend/src/domain/board/` documenting module purpose, components, data flow
- [x] T019 [P] [US1] Add README.md to `packages/backend/src/domain/card/` documenting module purpose, components, data flow
- [x] T020 [P] [US1] Add README.md to `packages/backend/src/domain/list/` documenting module purpose, components, data flow
- [x] T021 [P] [US1] Add README.md to `packages/backend/src/domain/user/` documenting module purpose, components, data flow
- [x] T022 [P] [US1] Add README.md to `packages/backend/src/domain/activity/` documenting module purpose, components, data flow
- [x] T023 [P] [US1] Add README.md to `packages/backend/src/domain/comment/` documenting module purpose, components, data flow
- [x] T024 [P] [US1] Add README.md to `packages/backend/src/domain/label/` documenting module purpose, components, data flow
- [x] T025 [P] [US1] Add README.md to `packages/backend/src/domain/checklist/` documenting module purpose, components, data flow
- [x] T026 [P] [US1] Add README.md to `packages/backend/src/domain/attachment/` documenting module purpose, components, data flow
- [x] T027 [P] [US1] Add README.md to `packages/backend/src/domain/organization/` documenting module purpose, components, data flow

### JSDoc Documentation - Board Module

- [ ] T028 [P] [US1] Add JSDoc to Board entity in `packages/backend/src/domain/board/entities/board.entity.ts` (class, properties, relationships)
- [ ] T029 [P] [US1] Add JSDoc to BoardService in `packages/backend/src/domain/board/services/board.service.ts` (all public methods with @param, @returns, @throws, @example)
- [ ] T030 [P] [US1] Add JSDoc to BoardController in `packages/backend/src/presentation/controllers/board.controller.ts` (all endpoints)

### JSDoc Documentation - Card Module

- [ ] T031 [P] [US1] Add JSDoc to Card entity in `packages/backend/src/domain/card/entities/card.entity.ts` (class, properties, relationships)
- [ ] T032 [P] [US1] Add JSDoc to CardService in `packages/backend/src/domain/card/services/card.service.ts` (all public methods)
- [ ] T033 [P] [US1] Add JSDoc to CardController in `packages/backend/src/presentation/controllers/card.controller.ts` (all endpoints)

### JSDoc Documentation - Other Modules

- [ ] T034 [P] [US1] Add JSDoc to List entity and ListService in `packages/backend/src/domain/list/`
- [ ] T035 [P] [US1] Add JSDoc to User entity and UserService in `packages/backend/src/domain/user/`
- [ ] T036 [P] [US1] Add JSDoc to Activity entity and ActivityService in `packages/backend/src/domain/activity/`
- [ ] T037 [P] [US1] Add JSDoc to Comment entity and CommentService in `packages/backend/src/domain/comment/`
- [ ] T038 [P] [US1] Add JSDoc to Label entity and LabelService in `packages/backend/src/domain/label/`
- [ ] T039 [P] [US1] Add JSDoc to Checklist/ChecklistItem entities and services in `packages/backend/src/domain/checklist/`
- [ ] T040 [P] [US1] Add JSDoc to Attachment entity and AttachmentService in `packages/backend/src/domain/attachment/`
- [ ] T041 [P] [US1] Add JSDoc to Organization entity and OrganizationService in `packages/backend/src/domain/organization/`

### Dependency Injection & Architecture Cleanup

- [ ] T042 [US1] Refactor BoardService in `packages/backend/src/domain/board/services/board.service.ts` to use constructor injection with explicit interfaces
- [ ] T043 [US1] Refactor CardService in `packages/backend/src/domain/card/services/card.service.ts` to use constructor injection with explicit interfaces
- [ ] T044 [US1] Audit and eliminate circular dependencies in `packages/backend/src/app.module.ts` and feature modules
- [ ] T045 [US1] Verify all services follow dependency flow (controllers → app services → domain services → repositories)

### Code Complexity Reduction

- [ ] T046 [US1] Refactor complex methods in BoardService (complexity >10) by extracting to separate methods in `packages/backend/src/domain/board/services/board.service.ts`
- [ ] T047 [US1] Refactor complex methods in CardService (complexity >10) by extracting to separate methods in `packages/backend/src/domain/card/services/card.service.ts`
- [ ] T048 [US1] Audit all service methods for SRP violations and extract domain logic where appropriate

### OpenAPI Documentation

- [ ] T049 [US1] Add @ApiTags, @ApiOperation, @ApiResponse decorators to BoardController in `packages/backend/src/presentation/controllers/board.controller.ts`
- [ ] T050 [US1] Add @ApiTags, @ApiOperation, @ApiResponse decorators to CardController in `packages/backend/src/presentation/controllers/card.controller.ts`
- [ ] T051 [US1] Add @ApiProperty decorators to all DTOs in `packages/backend/src/presentation/dto/` (request and response)
- [ ] T052 [US1] Verify OpenAPI documentation accessible at `/api/docs` with all endpoints documented

**Checkpoint**: Documentation complete, code organization improved, onboarding time measurable

---

## Phase 4: User Story 2 - Reliable Error Handling (Priority: P2)

**Goal**: Implement comprehensive error handling and structured logging to reduce MTTR from hours to minutes

**Independent Test**: Simulate error scenarios (database failure, validation errors) and verify proper logging, status codes, and recovery

**Duration**: ~16 hours  
**Dependencies**: Phase 2 complete (can run parallel with US1)

### Exception Implementation

- [ ] T053 [P] [US2] Implement BoardNotFoundException in `packages/backend/src/domain/shared/exceptions/board-not-found.exception.ts`
- [ ] T054 [P] [US2] Implement CardNotFoundException in `packages/backend/src/domain/shared/exceptions/card-not-found.exception.ts`
- [ ] T055 [P] [US2] Implement BoardConflictException in `packages/backend/src/domain/shared/exceptions/board-conflict.exception.ts`
- [ ] T056 [P] [US2] Implement CardValidationException in `packages/backend/src/domain/shared/exceptions/card-validation.exception.ts`

### Service Error Handling

- [ ] T057 [US2] Update BoardService in `packages/backend/src/domain/board/services/board.service.ts` to throw custom exceptions (BoardNotFoundException, BoardConflictException)
- [ ] T058 [US2] Update CardService in `packages/backend/src/domain/card/services/card.service.ts` to throw custom exceptions (CardNotFoundException, CardValidationException)
- [ ] T059 [US2] Add try-catch blocks with proper error handling to all repository methods in `packages/backend/src/infrastructure/persistence/repositories/`

### Structured Logging

- [ ] T060 [P] [US2] Configure Winston logger in `packages/backend/src/config/logger.config.ts` with log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- [ ] T061 [US2] Add structured logging to BoardService operations in `packages/backend/src/domain/board/services/board.service.ts` (log on create, update, delete with context)
- [ ] T062 [US2] Add structured logging to CardService operations in `packages/backend/src/domain/card/services/card.service.ts`
- [ ] T063 [US2] Add request ID middleware in `packages/backend/src/presentation/middleware/request-id.middleware.ts` for log correlation

### Global Exception Filter Enhancement

- [ ] T064 [US2] Enhance global exception filter in `packages/backend/src/presentation/filters/global-exception.filter.ts` to include request ID, user ID, endpoint in logs
- [ ] T065 [US2] Add error response sanitization to global filter to prevent sensitive data exposure (no stack traces in production)
- [ ] T066 [US2] Implement error response format validation in global filter (statusCode, errorCode, message, timestamp, requestId)

### Error Recovery

- [ ] T067 [US2] Implement database connection retry logic in `packages/backend/src/config/database.config.ts`
- [ ] T068 [US2] Implement Redis connection fallback in `packages/backend/src/infrastructure/cache/redis-cache.service.ts` (graceful degradation)
- [ ] T069 [US2] Add circuit breaker pattern for external service calls (email, storage) in `packages/backend/src/infrastructure/`

**Checkpoint**: All errors properly handled, logged with context, system recovers gracefully

---

## Phase 5: User Story 3 - Type Safety & Validation (Priority: P3)

**Goal**: Enforce TypeScript strict mode and comprehensive validation to catch 60-70% of errors at compile time

**Independent Test**: Attempt to send invalid payloads to endpoints and verify validation, compile TypeScript with strict mode

**Duration**: ~20 hours  
**Dependencies**: Phase 2 complete (can run parallel with US1, US2)

### TypeScript Strict Mode Enforcement

- [ ] T070 [P] [US3] Audit all files in `packages/backend/src/domain/` for `any` types and replace with explicit types or `unknown` with validation
- [ ] T071 [P] [US3] Audit all files in `packages/backend/src/application/` for `any` types and replace
- [ ] T072 [P] [US3] Audit all files in `packages/backend/src/infrastructure/` for `any` types and replace
- [ ] T073 [P] [US3] Audit all files in `packages/backend/src/presentation/` for `any` types and replace
- [ ] T074 [US3] Add explicit return types to all public methods in services (Board, Card, List, User, Activity, Comment, Label, Checklist, Attachment, Organization)

### Entity Type Safety

- [ ] T075 [P] [US3] Add explicit TypeORM decorators to Board entity in `packages/backend/src/domain/board/entities/board.entity.ts` (@Column with type, length, nullable)
- [ ] T076 [P] [US3] Add explicit TypeORM decorators to Card entity in `packages/backend/src/domain/card/entities/card.entity.ts`
- [ ] T077 [P] [US3] Add explicit TypeORM decorators to List entity in `packages/backend/src/domain/list/entities/list.entity.ts`
- [ ] T078 [P] [US3] Add explicit TypeORM decorators to User entity in `packages/backend/src/domain/user/entities/user.entity.ts`
- [ ] T079 [P] [US3] Add explicit TypeORM decorators to Activity entity in `packages/backend/src/domain/activity/entities/activity.entity.ts`
- [ ] T080 [P] [US3] Add explicit TypeORM decorators to Comment, Label, Checklist, ChecklistItem, Attachment, Organization entities

### Value Objects for JSON Fields

- [ ] T081 [P] [US3] Create BoardSettings value object in `packages/backend/src/domain/shared/value-objects/board-settings.vo.ts` with class-validator decorators
- [ ] T082 [P] [US3] Create ActivityData value object in `packages/backend/src/domain/shared/value-objects/activity-data.vo.ts`
- [ ] T083 [US3] Update Board entity to use BoardSettings value object instead of raw JSON
- [ ] T084 [US3] Update Activity entity to use ActivityData value object instead of raw JSON

### DTO Validation

- [ ] T085 [P] [US3] Add class-validator decorators to CreateBoardDto in `packages/backend/src/presentation/dto/request/create-board.dto.ts` (@IsString, @MinLength, @MaxLength, @IsEnum)
- [ ] T086 [P] [US3] Add class-validator decorators to UpdateBoardDto in `packages/backend/src/presentation/dto/request/update-board.dto.ts`
- [ ] T087 [P] [US3] Add class-validator decorators to CreateCardDto in `packages/backend/src/presentation/dto/request/create-card.dto.ts`
- [ ] T088 [P] [US3] Add class-validator decorators to UpdateCardDto in `packages/backend/src/presentation/dto/request/update-card.dto.ts`
- [ ] T089 [P] [US3] Add class-validator decorators to all other request DTOs (List, Comment, Label, Checklist, Attachment, Organization)

### Response DTO Serialization

- [ ] T090 [P] [US3] Add @Expose and @Exclude decorators to BoardResponseDto in `packages/backend/src/presentation/dto/response/board-response.dto.ts` (exclude deletedAt, sensitive fields)
- [ ] T091 [P] [US3] Add @Expose and @Exclude decorators to CardResponseDto in `packages/backend/src/presentation/dto/response/card-response.dto.ts`
- [ ] T092 [P] [US3] Add @Expose and @Exclude decorators to UserResponseDto (exclude password, tokens)
- [ ] T093 [P] [US3] Add @Transform decorators for date serialization (ISO 8601) in all response DTOs

### Validation Testing

- [ ] T094 [US3] Verify ValidationPipe rejects requests with unknown properties (forbidNonWhitelisted test)
- [ ] T095 [US3] Verify ValidationPipe transforms request data types correctly (string to number, etc.)
- [ ] T096 [US3] Verify TypeScript compilation passes with zero errors in strict mode

**Checkpoint**: Zero `any` types, all requests validated, all responses type-safe

---

## Phase 6: User Story 4 - Testable Architecture (Priority: P4)

**Goal**: Implement comprehensive test suite with 80%+ coverage to enable TDD and reduce bugs by 40-60%

**Independent Test**: Measure test coverage (must be >80%), test execution time (<30s for unit tests), verify mocking works

**Duration**: ~32 hours  
**Dependencies**: Phase 2 complete (can run parallel with US1, US2, US3)

### Test Infrastructure

- [ ] T097 [P] [US4] Create board test fixtures in `packages/backend/test/fixtures/board.fixture.ts` with factory methods (validBoard, boardWithLists)
- [ ] T098 [P] [US4] Create card test fixtures in `packages/backend/test/fixtures/card.fixture.ts`
- [ ] T099 [P] [US4] Create user test fixtures in `packages/backend/test/fixtures/user.fixture.ts`
- [ ] T100 [P] [US4] Create list test fixtures in `packages/backend/test/fixtures/list.fixture.ts`
- [ ] T101 [P] [US4] Create mock helper utilities in `packages/backend/test/helpers/mock.helper.ts` for repository mocks

### Unit Tests - Board Module

- [ ] T102 [P] [US4] Write unit tests for BoardService.createBoard in `packages/backend/test/unit/domain/board/board.service.spec.ts` (happy path, validation errors, conflicts)
- [ ] T103 [P] [US4] Write unit tests for BoardService.findById in `packages/backend/test/unit/domain/board/board.service.spec.ts`
- [ ] T104 [P] [US4] Write unit tests for BoardService.updateBoard in `packages/backend/test/unit/domain/board/board.service.spec.ts`
- [ ] T105 [P] [US4] Write unit tests for BoardService.deleteBoard in `packages/backend/test/unit/domain/board/board.service.spec.ts`
- [ ] T106 [P] [US4] Write unit tests for BoardService.findBoardsForUser in `packages/backend/test/unit/domain/board/board.service.spec.ts`

### Unit Tests - Card Module

- [ ] T107 [P] [US4] Write unit tests for CardService.createCard in `packages/backend/test/unit/domain/card/card.service.spec.ts`
- [ ] T108 [P] [US4] Write unit tests for CardService.updateCard in `packages/backend/test/unit/domain/card/card.service.spec.ts`
- [ ] T109 [P] [US4] Write unit tests for CardService.moveCard in `packages/backend/test/unit/domain/card/card.service.spec.ts`
- [ ] T110 [P] [US4] Write unit tests for CardService.deleteCard in `packages/backend/test/unit/domain/card/card.service.spec.ts`

### Unit Tests - Other Modules

- [ ] T111 [P] [US4] Write unit tests for ListService (create, update, delete, reorder) in `packages/backend/test/unit/domain/list/list.service.spec.ts`
- [ ] T112 [P] [US4] Write unit tests for UserService in `packages/backend/test/unit/domain/user/user.service.spec.ts`
- [ ] T113 [P] [US4] Write unit tests for ActivityService in `packages/backend/test/unit/domain/activity/activity.service.spec.ts`
- [ ] T114 [P] [US4] Write unit tests for CommentService in `packages/backend/test/unit/domain/comment/comment.service.spec.ts`

### Integration Tests - API Endpoints

- [ ] T115 [P] [US4] Write integration test for POST /boards in `packages/backend/test/integration/api/board.controller.integration.spec.ts` (with test database)
- [ ] T116 [P] [US4] Write integration test for GET /boards/:id in `packages/backend/test/integration/api/board.controller.integration.spec.ts`
- [ ] T117 [P] [US4] Write integration test for PATCH /boards/:id in `packages/backend/test/integration/api/board.controller.integration.spec.ts`
- [ ] T118 [P] [US4] Write integration test for DELETE /boards/:id in `packages/backend/test/integration/api/board.controller.integration.spec.ts`
- [ ] T119 [P] [US4] Write integration test for POST /cards in `packages/backend/test/integration/api/card.controller.integration.spec.ts`
- [ ] T120 [P] [US4] Write integration test for PATCH /cards/:id in `packages/backend/test/integration/api/card.controller.integration.spec.ts`

### Integration Tests - Database

- [ ] T121 [P] [US4] Write repository integration test for BoardRepository.findByIdWithLists in `packages/backend/test/integration/database/board.repository.integration.spec.ts` (verify no N+1 queries)
- [ ] T122 [P] [US4] Write repository integration test for BoardRepository.findAccessibleByUser in `packages/backend/test/integration/database/board.repository.integration.spec.ts` (verify index usage)
- [ ] T123 [P] [US4] Write repository integration test for CardRepository with eager loading in `packages/backend/test/integration/database/card.repository.integration.spec.ts`

### Test Execution & Coverage

- [ ] T124 [US4] Configure Jest to run tests in parallel in `packages/backend/jest.config.js`
- [ ] T125 [US4] Verify unit test execution time <10 seconds (optimize slow tests if needed)
- [ ] T126 [US4] Verify full test suite execution time <30 seconds
- [ ] T127 [US4] Generate coverage report and verify 80%+ overall, 90%+ for services
- [ ] T128 [US4] Add coverage badge to README and CI/CD pipeline

**Checkpoint**: 80%+ test coverage achieved, all tests pass, fast execution

---

## Phase 7: User Story 5 - Performance Optimization (Priority: P5)

**Goal**: Optimize queries, implement caching, and tune connection pooling to achieve p95 <200ms at 1000 req/s

**Independent Test**: Run load tests with realistic data (1000+ boards, 10k+ cards), measure p95 latency, verify cache hit rate >80%

**Duration**: ~24 hours  
**Dependencies**: Phase 2 complete, US4 tests helpful for regression detection

### Database Query Optimization

- [ ] T129 [P] [US5] Audit all queries in BoardRepository using EXPLAIN ANALYZE in `packages/backend/src/infrastructure/persistence/repositories/board.repository.ts`
- [ ] T130 [P] [US5] Audit all queries in CardRepository using EXPLAIN ANALYZE in `packages/backend/src/infrastructure/persistence/repositories/card.repository.ts`
- [ ] T131 [US5] Create migration to add missing indexes in `packages/backend/migrations/` (boards.user_id, boards.organization_id, cards.list_id, lists.board_id)
- [ ] T132 [US5] Create composite index for soft delete queries in migration (boards: user_id, deleted_at WHERE deleted_at IS NULL)
- [ ] T133 [US5] Create index for sorting queries in migration (cards: list_id, position; lists: board_id, position)

### N+1 Query Elimination

- [ ] T134 [US5] Refactor BoardRepository.findByIdWithLists in `packages/backend/src/infrastructure/persistence/repositories/board.repository.ts` to use eager loading with relations
- [ ] T135 [US5] Refactor BoardRepository.findAccessibleByUser to use JOIN instead of separate queries
- [ ] T136 [US5] Refactor CardRepository.findByListId to eager load relationships (assignees, labels, checklist)
- [ ] T137 [US5] Verify all repository methods use eager loading for nested data (run query counter test)

### Redis Caching Implementation

- [ ] T138 [P] [US5] Configure Redis caching in `packages/backend/src/config/redis.config.ts` with TTL settings (user sessions 24h, board metadata 5min, user profiles 1h)
- [ ] T139 [US5] Implement cache-aside pattern in BoardService.findById in `packages/backend/src/domain/board/services/board.service.ts` (check cache, fetch from DB on miss, populate cache)
- [ ] T140 [US5] Implement cache invalidation in BoardService.updateBoard (delete cache entry on update)
- [ ] T141 [US5] Implement cache-aside pattern in UserService.findById for user profile caching
- [ ] T142 [US5] Implement cache invalidation strategy for cascade deletes (board deleted → invalidate all related list/card caches)

### Connection Pooling

- [ ] T143 [US5] Configure database connection pooling in `packages/backend/src/config/database.config.ts` (min: 5, max: 20, idleTimeout: 10s, connectionTimeout: 5s)
- [ ] T144 [US5] Configure Redis connection pooling with retry strategy in `packages/backend/src/config/redis.config.ts`
- [ ] T145 [US5] Add connection pool monitoring middleware in `packages/backend/src/presentation/middleware/db-metrics.middleware.ts`

### Pagination

- [ ] T146 [P] [US5] Add pagination to BoardController.findAll in `packages/backend/src/presentation/controllers/board.controller.ts` (default limit 50, max 100)
- [ ] T147 [P] [US5] Add pagination to CardController.findAll in `packages/backend/src/presentation/controllers/card.controller.ts`
- [ ] T148 [P] [US5] Add pagination to ActivityController.findByBoard (prevent unbounded activity queries)

### Slow Query Logging

- [ ] T149 [US5] Configure TypeORM slow query logging in `packages/backend/src/config/database.config.ts` (maxQueryExecutionTime: 100ms)
- [ ] T150 [US5] Create database performance monitoring dashboard config (track query time per endpoint)

### Performance Testing

- [ ] T151 [US5] Create k6 load test script in `packages/backend/test/performance/board-load-test.js` (simulate 1000 concurrent users)
- [ ] T152 [US5] Run baseline performance test and record p95 latency, throughput, error rate
- [ ] T153 [US5] Run performance test after optimizations and verify p95 <200ms at 1000 req/s
- [ ] T154 [US5] Verify cache hit rate >80% using Redis INFO stats
- [ ] T155 [US5] Verify database connection pool usage <70% at peak load

**Checkpoint**: Performance targets met (p95 <200ms, 1000 req/s, cache hit >80%)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation validation, and constitution compliance verification  
**Duration**: ~8 hours  
**Dependencies**: All user stories complete

- [ ] T156 [P] Update CONTRIBUTING.md in `packages/backend/CONTRIBUTING.md` with TDD workflow, code review process, and architecture guidelines
- [ ] T157 [P] Generate final OpenAPI spec in `specs/003-backend-clean-code/contracts/openapi-refactored.json` and compare with baseline (expect zero breaking changes)
- [ ] T158 Validate quickstart.md by having a new developer follow the guide and time to first contribution (target <4 hours)
- [ ] T159 Run full ESLint check and verify zero errors/warnings across entire backend codebase
- [ ] T160 Run full TypeScript compilation and verify zero errors in strict mode
- [ ] T161 [P] Verify all pre-commit hooks working (husky runs lint-staged on commit)
- [ ] T162 Run full test suite and verify 80%+ coverage, <30s execution time
- [ ] T163 [P] Constitution compliance verification:
  - [ ] Code quality: ESLint passes, TypeScript strict mode, cyclomatic complexity <10, zero `any` types
  - [ ] Testing: Coverage ≥80% overall, ≥90% critical paths, all tests passing
  - [ ] Performance: API p95 <200ms at 1000 req/s, database queries <50ms p95, cache hit rate >80%
  - [ ] Documentation: 100% public APIs have JSDoc, OpenAPI docs complete, all modules have README
  - [ ] Error handling: Structured logging, custom exceptions, global filter, no sensitive data exposure
- [ ] T164 Create refactoring summary report in `specs/003-backend-clean-code/FINAL-IMPLEMENTATION-REPORT.md` documenting metrics before/after, lessons learned, remaining tech debt

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Documentation and code organization
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Error handling (can run parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Type safety (can run parallel with US1, US2)
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) - Testing (can run parallel with US1, US2, US3)
- **User Story 5 (Phase 7)**: Depends on Foundational (Phase 2), benefits from US4 tests for regression detection
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

All user stories depend ONLY on Foundational (Phase 2) completion. User stories can proceed in parallel if team capacity allows.

### Within Each User Story

- Documentation tasks ([P]) can run in parallel
- JSDoc tasks ([P]) can run in parallel across different modules
- Test fixtures ([P]) can be created in parallel
- Unit tests ([P]) for different services can be written in parallel
- Integration tests ([P]) for different endpoints can be written in parallel
- Validation must follow implementation

### Parallel Opportunities

**High Parallelism**:

- Phase 1: All 5 tasks can run in parallel (different files)
- Phase 2: Tasks T007-T012 can run in parallel (different files)
- US1 Documentation: Tasks T014-T017 (4 parallel)
- US1 Module READMEs: Tasks T018-T027 (10 parallel)
- US1 JSDoc: Tasks T028-T041 (14 parallel across modules)
- US2 Exceptions: Tasks T053-T056 (4 parallel)
- US3 Type audits: Tasks T070-T073 (4 parallel)
- US3 Entity decorators: Tasks T075-T080 (6 parallel)
- US4 Test fixtures: Tasks T097-T101 (5 parallel)
- US4 Unit tests: Most tasks can run in parallel (different test files)
- US4 Integration tests: Tasks T115-T120 (6 parallel)

**Sequential Dependencies**:

- T083-T084 depend on T081-T082 (value objects must exist before use)
- Service refactoring tasks depend on understanding current complexity
- Performance optimization tasks benefit from running sequentially to measure impact

---

## Parallel Example: User Story 1

```bash
# Launch all documentation tasks together:
Task T014: "Create architecture.md"
Task T015: "Create api.md"
Task T016: "Create testing.md"
Task T017: "Create performance.md"

# Launch all module README tasks together (10 parallel):
Task T018-T027: "Add README.md to each domain module"

# Launch all JSDoc tasks together (14 parallel):
Task T028-T041: "Add JSDoc to entities, services, controllers"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Documentation & Maintainability)

1. Complete Phase 1: Setup (4 hours)
2. Complete Phase 2: Foundational (8 hours)
3. Complete Phase 3: User Story 1 (40 hours)
4. **STOP and VALIDATE**: Measure onboarding time for new developer
5. Document learnings and proceed to US2-US5 if successful

**MVP Deliverable**: Well-documented, organized codebase that reduces onboarding time to <4 hours

### Incremental Delivery (Recommended)

1. **Week 1**: Phase 1 Setup + Phase 2 Foundational → Foundation ready
2. **Week 2**: User Story 1 (Documentation) → Better onboarding
3. **Week 3**: User Story 2 (Error Handling) + User Story 3 (Type Safety) → More reliable
4. **Week 4**: User Story 4 (Testing) → 80% coverage achieved
5. **Week 5**: User Story 5 (Performance) → Production-ready optimization
6. **Week 6**: Phase 8 Polish → Constitution compliance verified

Each week adds measurable value without breaking existing functionality.

### Parallel Team Strategy

With 3+ developers after Foundational phase completes:

- **Developer A**: User Story 1 (Documentation) - 40 hours
- **Developer B**: User Story 2 (Error Handling) + User Story 3 (Type Safety) - 36 hours
- **Developer C**: User Story 4 (Testing) - 32 hours
- **All together**: User Story 5 (Performance) - 24 hours (requires coordination)

**Timeline**: ~3 weeks with 3 developers vs. 5 weeks with 1 developer

---

## Task Summary

**Total Tasks**: 164 tasks  
**Estimated Time**: 192 hours (24 working days for 1 developer, ~15 days for 3 developers)

**Breakdown by Phase**:

- Phase 1 (Setup): 5 tasks, ~4 hours
- Phase 2 (Foundational): 8 tasks, ~8 hours
- Phase 3 (US1 - Maintainable): 39 tasks, ~40 hours
- Phase 4 (US2 - Error Handling): 17 tasks, ~16 hours
- Phase 5 (US3 - Type Safety): 27 tasks, ~20 hours
- Phase 6 (US4 - Testing): 32 tasks, ~32 hours
- Phase 7 (US5 - Performance): 27 tasks, ~24 hours
- Phase 8 (Polish): 9 tasks, ~8 hours

**Parallel Opportunities**: ~60% of tasks marked [P] can run in parallel (93 tasks)

**Independent Test Criteria**:

- US1: New developer implements feature in <4 hours
- US2: Error scenarios properly handled and logged
- US3: TypeScript strict mode passes, no validation errors
- US4: 80%+ test coverage, <30s test execution
- US5: p95 <200ms at 1000 req/s, cache hit >80%

---

## Notes

- All tasks include exact file paths for implementation
- [P] tasks target different files and can run in parallel
- [Story] labels map tasks to user stories for traceability
- No API contract changes - backward compatible refactoring only
- Tests are included as implementation tasks (not separate TDD cycle)
- Constitution compliance verified in Phase 8
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
