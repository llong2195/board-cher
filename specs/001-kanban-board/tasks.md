# Tasks: Collaborative Kanban Board Application

**Feature**: 001-kanban-board  
**Branch**: `001-kanban-board`  
**Date**: 2025-10-31  
**Input**: plan.md, spec.md, data-model.md, contracts/openapi.yaml, contracts/websocket-events.md, research.md

**Tests**: Tests are MANDATORY per the constitution (Principle II: Test-First Development). All tasks must follow TDD: Write test → Verify failure → Implement → Verify pass → Refactor. Test tasks are marked with ⚠️ and MUST be completed before implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic monorepo structure

- [x] T001 Create monorepo structure with pnpm workspace in root `pnpm-workspace.yaml` with packages: backend, frontend, shared
- [x] T002 [P] Initialize backend package at `packages/backend/` with NestJS CLI: `nest new backend --package-manager pnpm`
- [x] T003 [P] Initialize frontend package at `packages/frontend/` with Vite + React + TypeScript: `pnpm create vite frontend --template react-ts`
- [x] T004 [P] Initialize shared package at `packages/shared/` with minimal `package.json` and `tsconfig.json`
- [x] T005 [P] Configure TypeScript strict mode in all packages: `packages/backend/tsconfig.json`, `packages/frontend/tsconfig.json`, `packages/shared/tsconfig.json`
- [x] T006 [P] Setup ESLint + Prettier in root `.eslintrc.js`, `.prettierrc` with TypeScript rules
- [x] T007 [P] Configure Husky pre-commit hooks in `.husky/pre-commit` to run `lint-staged` with ESLint + Prettier
- [x] T008 Setup Docker Compose in `docker-compose.yml` with services: postgres, redis, backend, frontend
- [x] T009 Create root `README.md` with project overview, setup instructions, and architecture diagram
- [x] T010 [P] Create environment templates: `packages/backend/.env.example`, `packages/frontend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM Setup

- [x] T011 Install TypeORM dependencies in backend: `typeorm@0.3.x`, `@nestjs/typeorm`, `pg`, `sqlite3`
- [x] T012 Configure TypeORM module in `packages/backend/src/config/database.config.ts` with SQLite (dev) and PostgreSQL (prod) support
- [x] T013 Setup TypeORM migrations in `packages/backend/migrations/` with npm script `migration:generate` and `migration:run`
- [x] T014 Create base abstract entity in `packages/backend/src/infrastructure/persistence/base.entity.ts` with id, createdAt, updatedAt fields

### Authentication & Authorization Framework

- [ ] T015 Install auth dependencies in backend: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `class-validator`
- [ ] T016 [P] Create User entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/user.entity.ts` with email, passwordHash, name, avatarUrl
- [ ] T017 [P] Create User domain model in `packages/backend/src/domain/user/user.model.ts` with validation logic
- [ ] T018 Create User repository interface in `packages/backend/src/domain/user/user.repository.ts` and implementation in `packages/backend/src/infrastructure/persistence/repositories/user.repository.impl.ts`
- [ ] T019 Create AuthService in `packages/backend/src/application/services/auth.service.ts` with register, login, validateToken methods
- [ ] T020 Create JWT strategy in `packages/backend/src/infrastructure/auth/jwt.strategy.ts` with token validation
- [ ] T021 Create JwtAuthGuard in `packages/backend/src/infrastructure/auth/jwt-auth.guard.ts` for protecting endpoints
- [ ] T022 Create AuthController in `packages/backend/src/presentation/controllers/auth.controller.ts` with POST /auth/register, POST /auth/login, POST /auth/refresh endpoints
- [ ] T023 [P] Create auth DTOs in `packages/backend/src/presentation/dto/auth/`: RegisterDto, LoginDto, LoginResponseDto with class-validator decorators

### Redis Cache & Pub/Sub Setup

- [ ] T024 Install Redis dependencies in backend: `ioredis@5.x`, `@nestjs/cache-manager`, `cache-manager-ioredis-yet`
- [ ] T025 Configure Redis module in `packages/backend/src/config/redis.config.ts` with connection settings
- [ ] T026 Create CacheService in `packages/backend/src/infrastructure/cache/cache.service.ts` with get, set, delete, invalidate methods
- [ ] T027 Configure Cache module in `packages/backend/src/infrastructure/cache/cache.module.ts` with TTL defaults

### Error Handling & Logging

- [ ] T028 [P] Create global exception filter in `packages/backend/src/presentation/filters/http-exception.filter.ts` with user-friendly error messages
- [ ] T029 [P] Create logger service in `packages/backend/src/infrastructure/logging/logger.service.ts` using NestJS Logger with contextual logging
- [ ] T030 [P] Create validation pipe in `packages/backend/src/presentation/pipes/validation.pipe.ts` using class-validator for DTO validation
- [ ] T031 Register global filters, pipes, and interceptors in `packages/backend/src/main.ts`

### Configuration Management

- [ ] T032 Install config dependencies: `@nestjs/config`, `joi`
- [ ] T033 Create config schema validation in `packages/backend/src/config/config.schema.ts` using Joi for environment variables
- [ ] T034 Create config module in `packages/backend/src/config/config.module.ts` with database, redis, jwt, file storage settings

### Shared Types Package

- [ ] T035 [P] Create shared types in `packages/shared/src/types/`: User.ts, Board.ts, List.ts, Card.ts, Organization.ts
- [ ] T036 [P] Create shared constants in `packages/shared/src/constants/`: roles.ts (USER_ROLES, BOARD_ROLES), permissions.ts
- [ ] T037 [P] Create shared validation schemas in `packages/shared/src/validators/` using zod or class-validator for reuse

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 3 - Real-time Collaboration (Priority: P1) 🎯 MVP

**Goal**: Enable multiple users on the same board to see each other's changes instantly via WebSocket

**Independent Test**: Open same board in two browser windows with different users. When one user creates/moves a card, the other sees it appear immediately without refresh.

**Rationale for Priority**: This story is implemented BEFORE User Story 1 because real-time infrastructure (Socket.io gateway, Redis adapter, event system) is foundational and affects how we implement card/list mutations. Building this first prevents refactoring later.

### Tests for User Story 3 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T038 [P] [US3] WebSocket connection test in `packages/backend/test/e2e/websocket/connection.e2e-spec.ts` - verify JWT auth handshake succeeds
- [ ] T039 [P] [US3] Board room join test in `packages/backend/test/e2e/websocket/board-room.e2e-spec.ts` - verify user joins board room and receives member list
- [ ] T040 [P] [US3] Real-time broadcast test in `packages/backend/test/e2e/websocket/broadcast.e2e-spec.ts` - verify card creation broadcasts to all connected users
- [ ] T041 [P] [US3] Redis pub/sub scaling test in `packages/backend/test/integration/websocket/redis-adapter.integration-spec.ts` - verify events propagate across multiple server instances

### Implementation for User Story 3

- [ ] T042 Install Socket.io dependencies: `@nestjs/platform-socket.io`, `socket.io@4.x`, `@socket.io/redis-adapter`
- [ ] T043 Create WebSocket gateway in `packages/backend/src/infrastructure/websocket/board.gateway.ts` with JWT authentication, board room management
- [ ] T044 Configure Socket.io Redis adapter in `packages/backend/src/infrastructure/websocket/websocket-adapter.config.ts` for horizontal scaling
- [ ] T045 Create WebSocket event types in `packages/shared/src/types/websocket-events.ts` (board:join, board:leave, board:updated, list:created, etc.)
- [ ] T046 [P] Implement board:join handler in `packages/backend/src/infrastructure/websocket/handlers/board-join.handler.ts` with permission check
- [ ] T047 [P] Implement board:leave handler in `packages/backend/src/infrastructure/websocket/handlers/board-leave.handler.ts`
- [ ] T048 Create domain event emitter in `packages/backend/src/domain/shared/domain-event.emitter.ts` for publishing domain events
- [ ] T049 Create WebSocket event publisher service in `packages/backend/src/infrastructure/websocket/websocket-event-publisher.service.ts` to broadcast domain events
- [ ] T050 Wire domain events to WebSocket broadcasts in `packages/backend/src/infrastructure/websocket/domain-event-subscriber.ts`
- [ ] T051 [P] Create frontend WebSocket client service in `packages/frontend/src/services/websocket.service.ts` with auto-reconnect, event handlers
- [ ] T052 [P] Create React hook `useWebSocket` in `packages/frontend/src/hooks/useWebSocket.ts` for component integration
- [ ] T053 [P] Create React hook `useBoardRealtime` in `packages/frontend/src/hooks/useBoardRealtime.ts` for board-specific real-time updates
- [ ] T054 [US3] Add WebSocket connection indicator component in `packages/frontend/src/components/WebSocketStatus.tsx` (connected/disconnected/reconnecting)
- [ ] T055 [US3] Verify all tests pass and coverage ≥80% for WebSocket modules

**Checkpoint**: Real-time infrastructure complete - board/list/card changes will now broadcast automatically

---

## Phase 4: User Story 1 - Create and Organize Work Items (Priority: P1) 🎯 MVP

**Goal**: Users can create boards, add lists (workflow columns), create cards in lists, and move cards between lists via drag-and-drop

**Independent Test**: Login, create board "Marketing", add lists "To Do", "In Progress", "Done", create card "Design landing page" in "To Do", drag card to "In Progress", refresh page and verify card stayed in new position.

### Tests for User Story 1 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T056 [P] [US1] Board CRUD API tests in `packages/backend/test/e2e/board/board-crud.e2e-spec.ts` - POST, GET, PUT, DELETE /boards endpoints
- [ ] T057 [P] [US1] List CRUD API tests in `packages/backend/test/e2e/list/list-crud.e2e-spec.ts` - POST, GET, PUT, DELETE /boards/:id/lists endpoints
- [ ] T058 [P] [US1] Card CRUD API tests in `packages/backend/test/e2e/card/card-crud.e2e-spec.ts` - POST, GET, PUT, DELETE /lists/:id/cards endpoints
- [ ] T059 [P] [US1] Card move API test in `packages/backend/test/e2e/card/card-move.e2e-spec.ts` - PUT /cards/:id/move with listId and position
- [ ] T060 [P] [US1] Position recalculation unit test in `packages/backend/test/unit/domain/card/position-calculator.spec.ts`
- [ ] T061 [P] [US1] Board permissions unit test in `packages/backend/test/unit/domain/board/board-permissions.spec.ts` - verify role-based access
- [ ] T062 [P] [US1] Frontend board creation test in `packages/frontend/test/integration/board/create-board.test.tsx` using React Testing Library
- [ ] T063 [P] [US1] Frontend drag-and-drop test in `packages/frontend/test/integration/board/drag-drop-card.test.tsx` using React DnD test utils

### Implementation for User Story 1 - Data Layer

- [ ] T064 [P] [US1] Create Organization entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/organization.entity.ts`
- [ ] T065 [P] [US1] Create OrganizationMember entity in `packages/backend/src/infrastructure/persistence/entities/organization-member.entity.ts` with role enum
- [ ] T066 [P] [US1] Create Board entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/board.entity.ts` with organizationId FK
- [ ] T067 [P] [US1] Create BoardMember entity in `packages/backend/src/infrastructure/persistence/entities/board-member.entity.ts` with role enum
- [ ] T068 [P] [US1] Create List entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/list.entity.ts` with boardId FK, position
- [ ] T069 [P] [US1] Create Card entity (TypeORM) in `packages/backend/src/infrastructure/persistence/entities/card.entity.ts` with listId FK, position, title, description
- [ ] T070 [US1] Create database migration `1-create-board-structure.ts` for Organization, Board, BoardMember, List, Card tables with indexes on FKs and position fields

### Implementation for User Story 1 - Domain Layer

- [ ] T071 [P] [US1] Create Board domain model in `packages/backend/src/domain/board/board.model.ts` with validation and business rules
- [ ] T072 [P] [US1] Create List domain model in `packages/backend/src/domain/list/list.model.ts` with position logic
- [ ] T073 [P] [US1] Create Card domain model in `packages/backend/src/domain/card/card.model.ts` with position logic
- [ ] T074 [P] [US1] Create BoardRepository interface in `packages/backend/src/domain/board/board.repository.ts`
- [ ] T075 [P] [US1] Create ListRepository interface in `packages/backend/src/domain/list/list.repository.ts`
- [ ] T076 [P] [US1] Create CardRepository interface in `packages/backend/src/domain/card/card.repository.ts`
- [ ] T077 [P] [US1] Create domain events in `packages/backend/src/domain/board/events/`: BoardCreated, BoardUpdated, BoardDeleted
- [ ] T078 [P] [US1] Create domain events in `packages/backend/src/domain/list/events/`: ListCreated, ListMoved, ListUpdated, ListDeleted
- [ ] T079 [P] [US1] Create domain events in `packages/backend/src/domain/card/events/`: CardCreated, CardMoved, CardUpdated, CardDeleted

### Implementation for User Story 1 - Application Layer (CQRS)

- [ ] T080 [P] [US1] Create CreateBoardCommand handler in `packages/backend/src/application/commands/board/create-board.handler.ts`
- [ ] T081 [P] [US1] Create UpdateBoardCommand handler in `packages/backend/src/application/commands/board/update-board.handler.ts`
- [ ] T082 [P] [US1] Create DeleteBoardCommand handler in `packages/backend/src/application/commands/board/delete-board.handler.ts`
- [ ] T083 [P] [US1] Create GetBoardQuery handler in `packages/backend/src/application/queries/board/get-board.handler.ts`
- [ ] T084 [P] [US1] Create ListBoardsQuery handler in `packages/backend/src/application/queries/board/list-boards.handler.ts` with pagination
- [ ] T085 [P] [US1] Create CreateListCommand handler in `packages/backend/src/application/commands/list/create-list.handler.ts` with position calculation
- [ ] T086 [P] [US1] Create MoveListCommand handler in `packages/backend/src/application/commands/list/move-list.handler.ts` with position recalculation
- [ ] T087 [P] [US1] Create CreateCardCommand handler in `packages/backend/src/application/commands/card/create-card.handler.ts`
- [ ] T088 [P] [US1] Create MoveCardCommand handler in `packages/backend/src/application/commands/card/move-card.handler.ts` with cross-list support
- [ ] T089 [US1] Create PositionCalculatorService in `packages/backend/src/domain/shared/position-calculator.service.ts` for list/card reordering

### Implementation for User Story 1 - Infrastructure Layer

- [ ] T090 [P] [US1] Implement BoardRepository in `packages/backend/src/infrastructure/persistence/repositories/board.repository.impl.ts`
- [ ] T091 [P] [US1] Implement ListRepository in `packages/backend/src/infrastructure/persistence/repositories/list.repository.impl.ts`
- [ ] T092 [P] [US1] Implement CardRepository in `packages/backend/src/infrastructure/persistence/repositories/card.repository.impl.ts`
- [ ] T093 [US1] Add database indexes in migration: `(boardId, position)` for lists, `(listId, position)` for cards

### Implementation for User Story 1 - Presentation Layer (REST API)

- [ ] T094 [P] [US1] Create Board DTOs in `packages/backend/src/presentation/dto/board/`: CreateBoardDto, UpdateBoardDto, BoardResponseDto
- [ ] T095 [P] [US1] Create List DTOs in `packages/backend/src/presentation/dto/list/`: CreateListDto, MoveListDto, ListResponseDto
- [ ] T096 [P] [US1] Create Card DTOs in `packages/backend/src/presentation/dto/card/`: CreateCardDto, MoveCardDto, CardResponseDto
- [ ] T097 [US1] Create BoardController in `packages/backend/src/presentation/controllers/board.controller.ts` with GET /boards, POST /boards, GET /boards/:id, PUT /boards/:id, DELETE /boards/:id
- [ ] T098 [US1] Create ListController in `packages/backend/src/presentation/controllers/list.controller.ts` with GET /boards/:id/lists, POST /boards/:id/lists, PUT /lists/:id/move
- [ ] T099 [US1] Create CardController in `packages/backend/src/presentation/controllers/card.controller.ts` with GET /lists/:id/cards, POST /lists/:id/cards, PUT /cards/:id, PUT /cards/:id/move, DELETE /cards/:id
- [ ] T100 [US1] Add JwtAuthGuard to all board/list/card endpoints
- [ ] T101 [US1] Add permission guards to check board access in `packages/backend/src/infrastructure/auth/guards/board-permission.guard.ts`

### Implementation for User Story 1 - Frontend

- [ ] T102 [P] [US1] Create Board API client in `packages/frontend/src/services/api/board.api.ts` with CRUD methods
- [ ] T103 [P] [US1] Create List API client in `packages/frontend/src/services/api/list.api.ts` with CRUD methods
- [ ] T104 [P] [US1] Create Card API client in `packages/frontend/src/services/api/card.api.ts` with CRUD and move methods
- [ ] T105 [P] [US1] Create Board state store in `packages/frontend/src/stores/board.store.ts` using Zustand or Jotai
- [ ] T106 Install React DnD dependencies: `react-dnd`, `react-dnd-html5-backend`
- [ ] T107 [P] [US1] Create Board component in `packages/frontend/src/components/board/Board.tsx` with list rendering
- [ ] T108 [P] [US1] Create List component in `packages/frontend/src/components/board/List.tsx` with drag-and-drop, card rendering
- [ ] T109 [P] [US1] Create Card component in `packages/frontend/src/components/board/Card.tsx` with drag handle, click to open
- [ ] T110 [P] [US1] Create CreateListForm component in `packages/frontend/src/components/board/CreateListForm.tsx`
- [ ] T111 [P] [US1] Create CreateCardForm component in `packages/frontend/src/components/board/CreateCardForm.tsx`
- [ ] T112 [US1] Create BoardViewPage in `packages/frontend/src/pages/BoardViewPage.tsx` with board loading, WebSocket integration
- [ ] T113 [US1] Integrate real-time updates in Board component - subscribe to list:created, list:moved, card:created, card:moved WebSocket events
- [ ] T114 [US1] Add optimistic updates for card moves with rollback on failure
- [ ] T115 [US1] Add loading states (skeleton screens) for board/list/card loading
- [ ] T116 [US1] Verify all tests pass and coverage ≥80% for User Story 1 modules

**Checkpoint**: At this point, User Story 1 (Create and Organize) and User Story 3 (Real-time) are fully functional together - users can create boards, add lists, create cards, drag-and-drop cards, and see changes in real-time.

---

## Phase 5: User Story 2 - Enrich Cards with Details (Priority: P2)

**Goal**: Users can add rich information to cards: description, due date, file attachments, checklists, labels, comments

**Independent Test**: Open any card, add description "Build login page", set due date "2025-11-15", upload image "mockup.png", create checklist "Tasks" with 3 items, add label "urgent" (red), post comment "Started work". Verify all saved and visible.

### Tests for User Story 2 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T117 [P] [US2] Comment CRUD API tests in `packages/backend/test/e2e/comment/comment-crud.e2e-spec.ts` - POST /cards/:id/comments, GET, DELETE
- [ ] T118 [P] [US2] Attachment upload API tests in `packages/backend/test/e2e/attachment/attachment-upload.e2e-spec.ts` - POST /cards/:id/attachments with multipart/form-data
- [ ] T119 [P] [US2] Label CRUD API tests in `packages/backend/test/e2e/label/label-crud.e2e-spec.ts` - POST /boards/:id/labels, assign to card
- [ ] T120 [P] [US2] Checklist CRUD API tests in `packages/backend/test/e2e/checklist/checklist-crud.e2e-spec.ts` - POST /cards/:id/checklists, toggle items
- [ ] T121 [P] [US2] Card detail update test in `packages/backend/test/e2e/card/card-detail-update.e2e-spec.ts` - update description, dueDate
- [ ] T122 [P] [US2] Frontend card modal test in `packages/frontend/test/integration/card/card-modal.test.tsx` - open card, add comment, check checklist item

### Implementation for User Story 2 - Data Layer

- [ ] T123 [P] [US2] Create Comment entity in `packages/backend/src/infrastructure/persistence/entities/comment.entity.ts` with cardId FK, userId FK, text
- [ ] T124 [P] [US2] Create Attachment entity in `packages/backend/src/infrastructure/persistence/entities/attachment.entity.ts` with cardId FK, filename, size, storagePath
- [ ] T125 [P] [US2] Create Label entity in `packages/backend/src/infrastructure/persistence/entities/label.entity.ts` with boardId FK, name, color
- [ ] T126 [P] [US2] Create CardLabel entity in `packages/backend/src/infrastructure/persistence/entities/card-label.entity.ts` (many-to-many join)
- [ ] T127 [P] [US2] Create Checklist entity in `packages/backend/src/infrastructure/persistence/entities/checklist.entity.ts` with cardId FK, title
- [ ] T128 [P] [US2] Create ChecklistItem entity in `packages/backend/src/infrastructure/persistence/entities/checklist-item.entity.ts` with checklistId FK, text, isComplete
- [ ] T129 [US2] Add description and dueDate fields to Card entity (migration)
- [ ] T130 [US2] Create database migration `2-create-card-details.ts` for Comment, Attachment, Label, CardLabel, Checklist, ChecklistItem tables

### Implementation for User Story 2 - Domain Layer

- [ ] T131 [P] [US2] Create Comment domain model in `packages/backend/src/domain/comment/comment.model.ts`
- [ ] T132 [P] [US2] Create Attachment domain model in `packages/backend/src/domain/attachment/attachment.model.ts` with file validation
- [ ] T133 [P] [US2] Create Label domain model in `packages/backend/src/domain/label/label.model.ts` with color validation
- [ ] T134 [P] [US2] Create Checklist domain model in `packages/backend/src/domain/checklist/checklist.model.ts` with progress calculation
- [ ] T135 [P] [US2] Update Card domain model to include description, dueDate, comments, attachments, labels, checklists
- [ ] T136 [P] [US2] Create domain events: CommentAdded, AttachmentUploaded, LabelApplied, ChecklistItemToggled

### Implementation for User Story 2 - Application Layer

- [ ] T137 [P] [US2] Create AddCommentCommand handler in `packages/backend/src/application/commands/comment/add-comment.handler.ts`
- [ ] T138 [P] [US2] Create UploadAttachmentCommand handler in `packages/backend/src/application/commands/attachment/upload-attachment.handler.ts`
- [ ] T139 [P] [US2] Create CreateLabelCommand handler in `packages/backend/src/application/commands/label/create-label.handler.ts`
- [ ] T140 [P] [US2] Create ApplyLabelToCardCommand handler in `packages/backend/src/application/commands/card/apply-label.handler.ts`
- [ ] T141 [P] [US2] Create CreateChecklistCommand handler in `packages/backend/src/application/commands/checklist/create-checklist.handler.ts`
- [ ] T142 [P] [US2] Create ToggleChecklistItemCommand handler in `packages/backend/src/application/commands/checklist/toggle-item.handler.ts`
- [ ] T143 [P] [US2] Create UpdateCardDetailsCommand handler in `packages/backend/src/application/commands/card/update-card-details.handler.ts`
- [ ] T144 [US2] Create FileStorageService in `packages/backend/src/infrastructure/file-storage/file-storage.service.ts` for local file upload with size/type validation

### Implementation for User Story 2 - Presentation Layer

- [ ] T145 [P] [US2] Create Comment DTOs in `packages/backend/src/presentation/dto/comment/`: CreateCommentDto, CommentResponseDto
- [ ] T146 [P] [US2] Create Attachment DTOs in `packages/backend/src/presentation/dto/attachment/`: UploadAttachmentDto, AttachmentResponseDto
- [ ] T147 [P] [US2] Create Label DTOs in `packages/backend/src/presentation/dto/label/`: CreateLabelDto, LabelResponseDto
- [ ] T148 [P] [US2] Create Checklist DTOs in `packages/backend/src/presentation/dto/checklist/`: CreateChecklistDto, ToggleItemDto, ChecklistResponseDto
- [ ] T149 [US2] Create CommentController in `packages/backend/src/presentation/controllers/comment.controller.ts` with GET /cards/:id/comments, POST /cards/:id/comments, DELETE /comments/:id
- [ ] T150 [US2] Create AttachmentController in `packages/backend/src/presentation/controllers/attachment.controller.ts` with POST /cards/:id/attachments (multipart), GET /attachments/:id/download
- [ ] T151 [US2] Create LabelController in `packages/backend/src/presentation/controllers/label.controller.ts` with GET /boards/:id/labels, POST /boards/:id/labels, POST /cards/:id/labels/:labelId
- [ ] T152 [US2] Create ChecklistController in `packages/backend/src/presentation/controllers/checklist.controller.ts` with POST /cards/:id/checklists, POST /checklists/:id/items, PUT /checklist-items/:id/toggle
- [ ] T153 [US2] Update CardController GET /cards/:id to include comments, attachments, labels, checklists with eager loading

### Implementation for User Story 2 - Frontend

- [ ] T154 Install shadcn/ui components: `pnpm dlx shadcn-ui@latest add dialog button input textarea select label checkbox`
- [ ] T155 [P] [US2] Create Card API methods in `packages/frontend/src/services/api/card.api.ts`: updateDetails, getDetails
- [ ] T156 [P] [US2] Create Comment API client in `packages/frontend/src/services/api/comment.api.ts`
- [ ] T157 [P] [US2] Create Attachment API client in `packages/frontend/src/services/api/attachment.api.ts` with upload progress
- [ ] T158 [P] [US2] Create Label API client in `packages/frontend/src/services/api/label.api.ts`
- [ ] T159 [P] [US2] Create Checklist API client in `packages/frontend/src/services/api/checklist.api.ts`
- [ ] T160 [US2] Create CardModal component in `packages/frontend/src/components/card/CardModal.tsx` using shadcn/ui Dialog
- [ ] T161 [P] [US2] Create CardDescription section in `packages/frontend/src/components/card/CardDescription.tsx` with Markdown preview
- [ ] T162 [P] [US2] Create DueDatePicker component in `packages/frontend/src/components/card/DueDatePicker.tsx` using shadcn/ui date picker
- [ ] T163 [P] [US2] Create AttachmentList component in `packages/frontend/src/components/card/AttachmentList.tsx` with upload button and file list
- [ ] T164 [P] [US2] Create CommentList component in `packages/frontend/src/components/card/CommentList.tsx` with add comment form
- [ ] T165 [P] [US2] Create LabelSelector component in `packages/frontend/src/components/card/LabelSelector.tsx` with color picker
- [ ] T166 [P] [US2] Create ChecklistSection component in `packages/frontend/src/components/card/ChecklistSection.tsx` with progress bar
- [ ] T167 [US2] Integrate all card detail sections into CardModal
- [ ] T168 [US2] Add real-time updates for comments, attachments, labels, checklists via WebSocket (card:comment:added, card:checklist:updated, etc.)
- [ ] T169 [US2] Add optimistic updates for comment posting and checklist toggling
- [ ] T170 [US2] Verify all tests pass and coverage ≥80% for User Story 2 modules

**Checkpoint**: At this point, User Stories 1, 2, and 3 are functional - users can create boards with lists/cards, add rich details to cards, and see all changes in real-time.

---

## Phase 6: User Story 4 - Team Organization and Access Control (Priority: P2)

**Goal**: Users can create organizations, invite members with roles (owner/admin/member/guest), create boards within organizations, and enforce role-based permissions

**Independent Test**: Create organization "Acme Corp", invite user as "member", create board in org, verify member can edit. Invite another user as "guest", verify they can only view, not edit.

### Tests for User Story 4 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T171 [P] [US4] Organization CRUD API tests in `packages/backend/test/e2e/organization/organization-crud.e2e-spec.ts`
- [ ] T172 [P] [US4] Organization member management tests in `packages/backend/test/e2e/organization/member-management.e2e-spec.ts` - invite, remove, change role
- [ ] T173 [P] [US4] Board permission enforcement tests in `packages/backend/test/e2e/board/permissions.e2e-spec.ts` - verify guests cannot edit
- [ ] T174 [P] [US4] Role-based access unit tests in `packages/backend/test/unit/domain/organization/role-permissions.spec.ts`
- [ ] T175 [P] [US4] Frontend organization page test in `packages/frontend/test/integration/organization/organization-page.test.tsx`

### Implementation for User Story 4 - Domain Layer

- [ ] T176 [P] [US4] Create Organization domain model in `packages/backend/src/domain/organization/organization.model.ts`
- [ ] T177 [P] [US4] Create OrganizationMember domain model in `packages/backend/src/domain/organization/organization-member.model.ts` with role validation
- [ ] T178 [P] [US4] Create OrganizationRepository interface in `packages/backend/src/domain/organization/organization.repository.ts`
- [ ] T179 [P] [US4] Create domain events: OrganizationCreated, MemberInvited, MemberRemoved, MemberRoleChanged
- [ ] T180 [US4] Create PermissionService in `packages/backend/src/domain/shared/permission.service.ts` for checking user permissions on boards

### Implementation for User Story 4 - Application Layer

- [ ] T181 [P] [US4] Create CreateOrganizationCommand handler in `packages/backend/src/application/commands/organization/create-organization.handler.ts`
- [ ] T182 [P] [US4] Create InviteMemberCommand handler in `packages/backend/src/application/commands/organization/invite-member.handler.ts`
- [ ] T183 [P] [US4] Create RemoveMemberCommand handler in `packages/backend/src/application/commands/organization/remove-member.handler.ts`
- [ ] T184 [P] [US4] Create ChangeMemberRoleCommand handler in `packages/backend/src/application/commands/organization/change-member-role.handler.ts`
- [ ] T185 [P] [US4] Create GetOrganizationQuery handler in `packages/backend/src/application/queries/organization/get-organization.handler.ts`
- [ ] T186 [US4] Update CreateBoardCommand to require organizationId and verify user has permission

### Implementation for User Story 4 - Infrastructure Layer

- [ ] T187 [US4] Implement OrganizationRepository in `packages/backend/src/infrastructure/persistence/repositories/organization.repository.impl.ts`
- [ ] T188 [US4] Create permission guards in `packages/backend/src/infrastructure/auth/guards/`: OrganizationPermissionGuard, BoardPermissionGuard
- [ ] T189 [US4] Add database indexes on `(organizationId, userId)` and `(boardId, userId)` for permission lookups

### Implementation for User Story 4 - Presentation Layer

- [ ] T190 [P] [US4] Create Organization DTOs in `packages/backend/src/presentation/dto/organization/`: CreateOrganizationDto, InviteMemberDto, OrganizationResponseDto
- [ ] T191 [US4] Create OrganizationController in `packages/backend/src/presentation/controllers/organization.controller.ts` with GET /organizations, POST /organizations, GET /organizations/:id, POST /organizations/:id/members, DELETE /organizations/:id/members/:userId
- [ ] T192 [US4] Add OrganizationPermissionGuard to organization endpoints
- [ ] T193 [US4] Add BoardPermissionGuard to board/list/card endpoints to check user role

### Implementation for User Story 4 - Frontend

- [ ] T194 [P] [US4] Create Organization API client in `packages/frontend/src/services/api/organization.api.ts`
- [ ] T195 [P] [US4] Create OrganizationPage component in `packages/frontend/src/pages/OrganizationPage.tsx` with member list, board list
- [ ] T196 [P] [US4] Create InviteMemberDialog component in `packages/frontend/src/components/organization/InviteMemberDialog.tsx`
- [ ] T197 [P] [US4] Create MemberList component in `packages/frontend/src/components/organization/MemberList.tsx` with role badges, remove action
- [ ] T198 [US4] Update BoardViewPage to check user permissions and disable edit actions for guests (show view-only banner)
- [ ] T199 [US4] Add organization selector to navigation/sidebar
- [ ] T200 [US4] Verify all tests pass and coverage ≥80% for User Story 4 modules

**Checkpoint**: User Stories 1-4 complete - users can create organizations, invite team members, control access to boards, and collaborate in real-time with proper permissions.

---

## Phase 7: User Story 6 - Card Assignment and Notifications (Priority: P3)

**Goal**: Users can assign cards to team members, see assigned cards in "Assigned to me" view, and receive notifications for assignments and card updates

**Independent Test**: Assign card to "John", verify his avatar appears on card. As John, go to dashboard and see card in "Assigned to me". Add comment to John's card, verify he gets notification.

**Note**: User Story 6 is implemented BEFORE User Story 5 (Search) because assignment infrastructure is simpler and notifications provide more user value than search for early users.

### Tests for User Story 6 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T201 [P] [US6] Card assignment API tests in `packages/backend/test/e2e/card/assignment.e2e-spec.ts` - POST /cards/:id/assignments/:userId
- [ ] T202 [P] [US6] Assigned cards query tests in `packages/backend/test/e2e/card/assigned-to-me.e2e-spec.ts` - GET /cards/assigned-to-me
- [ ] T203 [P] [US6] Notification delivery test in `packages/backend/test/integration/notification/notification-delivery.integration-spec.ts`
- [ ] T204 [P] [US6] Frontend notification toast test in `packages/frontend/test/integration/notification/notification-toast.test.tsx`

### Implementation for User Story 6 - Data Layer

- [ ] T205 [US6] Create CardAssignment entity in `packages/backend/src/infrastructure/persistence/entities/card-assignment.entity.ts` with cardId FK, userId FK
- [ ] T206 [US6] Create database migration `3-create-card-assignment.ts` with composite unique constraint on (cardId, userId)

### Implementation for User Story 6 - Domain Layer

- [ ] T207 [P] [US6] Create CardAssignment domain model in `packages/backend/src/domain/card/card-assignment.model.ts`
- [ ] T208 [P] [US6] Update Card domain model to include assignees collection
- [ ] T209 [P] [US6] Create domain events: CardAssigned, CardUnassigned

### Implementation for User Story 6 - Application Layer

- [ ] T210 [P] [US6] Create AssignCardCommand handler in `packages/backend/src/application/commands/card/assign-card.handler.ts`
- [ ] T211 [P] [US6] Create UnassignCardCommand handler in `packages/backend/src/application/commands/card/unassign-card.handler.ts`
- [ ] T212 [P] [US6] Create GetAssignedCardsQuery handler in `packages/backend/src/application/queries/card/get-assigned-cards.handler.ts` with pagination
- [ ] T213 [US6] Create NotificationService in `packages/backend/src/application/services/notification.service.ts` (in-memory for now, can extend to email/push later)
- [ ] T214 [US6] Subscribe to CardAssigned, CommentAdded events to trigger notifications

### Implementation for User Story 6 - Presentation Layer

- [ ] T215 [P] [US6] Create Assignment DTOs in `packages/backend/src/presentation/dto/card/`: AssignCardDto, CardAssignmentResponseDto
- [ ] T216 [US6] Add POST /cards/:id/assignments/:userId and DELETE /cards/:id/assignments/:userId to CardController
- [ ] T217 [US6] Add GET /cards/assigned-to-me endpoint to CardController with pagination

### Implementation for User Story 6 - Frontend

- [ ] T218 [P] [US6] Create AssigneeSelector component in `packages/frontend/src/components/card/AssigneeSelector.tsx` with user search
- [ ] T219 [P] [US6] Create AssigneeAvatars component in `packages/frontend/src/components/card/AssigneeAvatars.tsx` to show on card preview
- [ ] T220 [P] [US6] Create AssignedToMePage component in `packages/frontend/src/pages/AssignedToMePage.tsx` with card list
- [ ] T221 [P] [US6] Create NotificationToast component in `packages/frontend/src/components/notification/NotificationToast.tsx` using shadcn/ui Toast
- [ ] T222 [US6] Add assignee selector to CardModal
- [ ] T223 [US6] Add assignee avatars to Card component
- [ ] T224 [US6] Subscribe to card:assigned, card:comment:added WebSocket events and show toast notifications
- [ ] T225 [US6] Add "Assigned to me" link to navigation sidebar
- [ ] T226 [US6] Verify all tests pass and coverage ≥80% for User Story 6 modules

**Checkpoint**: Users can now assign cards, view their assigned work, and receive real-time notifications.

---

## Phase 8: User Story 5 - Search and Filter Work Items (Priority: P3)

**Goal**: Users can search cards by text (title/description) and filter by labels, assignees, due dates across large boards

**Independent Test**: Create board with 50+ cards, search "login bug", verify only matching cards shown. Filter by label "urgent", verify only cards with that label shown. Filter by assignee "jane@example.com", verify only her cards shown.

### Tests for User Story 5 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T227 [P] [US5] Search API tests in `packages/backend/test/e2e/card/search.e2e-spec.ts` - GET /boards/:id/cards/search?q=text with pagination
- [ ] T228 [P] [US5] Filter API tests in `packages/backend/test/e2e/card/filter.e2e-spec.ts` - GET /boards/:id/cards?labelId=...&assigneeId=...&dueDate=...
- [ ] T229 [P] [US5] Full-text search performance test in `packages/backend/test/integration/search/search-performance.integration-spec.ts` - verify <2s for 10k cards
- [ ] T230 [P] [US5] Frontend search bar test in `packages/frontend/test/integration/board/search-bar.test.tsx` with debounced input

### Implementation for User Story 5 - Application Layer

- [ ] T231 [P] [US5] Create SearchCardsQuery handler in `packages/backend/src/application/queries/card/search-cards.handler.ts` with full-text search
- [ ] T232 [P] [US5] Create FilterCardsQuery handler in `packages/backend/src/application/queries/card/filter-cards.handler.ts` with multiple filter criteria
- [ ] T233 [US5] Add database indexes for search: full-text index on `(title, description)` or use PostgreSQL `tsvector` column
- [ ] T234 [US5] Add database indexes for filters: `(labelId)`, `(assigneeId)`, `(dueDate)` on cards

### Implementation for User Story 5 - Presentation Layer

- [ ] T235 [P] [US5] Create Search DTOs in `packages/backend/src/presentation/dto/card/`: SearchCardsDto, FilterCardsDto with query params
- [ ] T236 [US5] Add GET /boards/:id/cards/search and GET /boards/:id/cards to CardController with query filters

### Implementation for User Story 5 - Frontend

- [ ] T237 [P] [US5] Create SearchBar component in `packages/frontend/src/components/board/SearchBar.tsx` with debounced input (300ms)
- [ ] T238 [P] [US5] Create FilterPanel component in `packages/frontend/src/components/board/FilterPanel.tsx` with label/assignee/date dropdowns
- [ ] T239 [P] [US5] Create FilterChips component in `packages/frontend/src/components/board/FilterChips.tsx` to show active filters with clear action
- [ ] T240 [US5] Add search bar and filter panel to BoardViewPage toolbar
- [ ] T241 [US5] Update Board component to filter cards locally when filters applied
- [ ] T242 [US5] Add "Clear all filters" button when filters active
- [ ] T243 [US5] Verify all tests pass and coverage ≥80% for User Story 5 modules

**Checkpoint**: Users can search and filter cards effectively on large boards.

---

## Phase 9: User Story 7 - Activity History and Audit Trail (Priority: P3)

**Goal**: Display chronological activity feed showing all changes to cards/boards with actor, timestamp, and description

**Independent Test**: Create card, move it, add comment, change due date. Open activity feed and verify all 4 actions appear with timestamps and user names.

### Tests for User Story 7 (TDD - MANDATORY) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL, then implement to make them pass**

- [ ] T244 [P] [US7] Activity logging unit tests in `packages/backend/test/unit/domain/activity/activity-logger.spec.ts` - verify all domain events create activity records
- [ ] T245 [P] [US7] Activity query API tests in `packages/backend/test/e2e/activity/activity-query.e2e-spec.ts` - GET /cards/:id/activity, GET /boards/:id/activity
- [ ] T246 [P] [US7] Frontend activity feed test in `packages/frontend/test/integration/card/activity-feed.test.tsx`

### Implementation for User Story 7 - Data Layer

- [ ] T247 [US7] Create Activity entity in `packages/backend/src/infrastructure/persistence/entities/activity.entity.ts` with userId FK, entityType, entityId, actionType, metadata JSON
- [ ] T248 [US7] Create database migration `4-create-activity.ts` with indexes on `(entityType, entityId, createdAt)` for efficient queries

### Implementation for User Story 7 - Domain Layer

- [ ] T249 [P] [US7] Create Activity domain model in `packages/backend/src/domain/activity/activity.model.ts`
- [ ] T250 [P] [US7] Create ActivityRepository interface in `packages/backend/src/domain/activity/activity.repository.ts`

### Implementation for User Story 7 - Application Layer

- [ ] T251 [US7] Create ActivityLogger service in `packages/backend/src/application/services/activity-logger.service.ts` that subscribes to ALL domain events
- [ ] T252 [P] [US7] Create GetCardActivityQuery handler in `packages/backend/src/application/queries/activity/get-card-activity.handler.ts` with pagination
- [ ] T253 [P] [US7] Create GetBoardActivityQuery handler in `packages/backend/src/application/queries/activity/get-board-activity.handler.ts` with pagination
- [ ] T254 [US7] Wire ActivityLogger to domain event bus to auto-log all events

### Implementation for User Story 7 - Infrastructure Layer

- [ ] T255 [US7] Implement ActivityRepository in `packages/backend/src/infrastructure/persistence/repositories/activity.repository.impl.ts`

### Implementation for User Story 7 - Presentation Layer

- [ ] T256 [P] [US7] Create Activity DTOs in `packages/backend/src/presentation/dto/activity/`: ActivityResponseDto with human-readable action descriptions
- [ ] T257 [US7] Add GET /cards/:id/activity and GET /boards/:id/activity endpoints to new ActivityController in `packages/backend/src/presentation/controllers/activity.controller.ts`

### Implementation for User Story 7 - Frontend

- [ ] T258 [P] [US7] Create Activity API client in `packages/frontend/src/services/api/activity.api.ts`
- [ ] T259 [P] [US7] Create ActivityFeed component in `packages/frontend/src/components/card/ActivityFeed.tsx` with virtualized list for performance
- [ ] T260 [P] [US7] Create ActivityItem component in `packages/frontend/src/components/card/ActivityItem.tsx` with icon, timestamp, description
- [ ] T261 [US7] Add ActivityFeed section to CardModal
- [ ] T262 [US7] Create BoardActivityPage in `packages/frontend/src/pages/BoardActivityPage.tsx` accessible from board menu
- [ ] T263 [US7] Subscribe to all domain events via WebSocket and append to activity feed in real-time
- [ ] T264 [US7] Verify all tests pass and coverage ≥80% for User Story 7 modules

**Checkpoint**: All 7 user stories complete - full activity audit trail visible for transparency.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure constitution compliance

### Performance Optimization

- [ ] T265 [P] Add Redis caching for frequently accessed boards in BoardRepository with 5-minute TTL
- [ ] T266 [P] Add database query optimization: analyze EXPLAIN plans for N+1 queries, add missing indexes
- [ ] T267 [P] Implement cursor-based pagination for card lists in `packages/backend/src/application/queries/card/list-cards.handler.ts`
- [ ] T268 [P] Add virtual scrolling for long card lists in frontend List component using `react-virtual`
- [ ] T269 Setup k6 performance testing script in `packages/backend/test/performance/load-test.js` targeting 1000 req/s

### Security Hardening

- [ ] T270 [P] Add rate limiting middleware in `packages/backend/src/infrastructure/middleware/rate-limit.middleware.ts` using Redis: 100 req/min per user
- [ ] T271 [P] Add Helmet.js security headers in `packages/backend/src/main.ts`
- [ ] T272 [P] Add input sanitization for user-generated content (descriptions, comments) to prevent XSS
- [ ] T273 [P] Add CORS configuration in `packages/backend/src/main.ts` with allowed origins from env var
- [ ] T274 Audit all endpoints for authorization checks - verify every endpoint has guards

### User Experience

- [ ] T275 [P] Add loading skeletons for all pages using shadcn/ui Skeleton component
- [ ] T276 [P] Add error boundaries in frontend using React Error Boundary for graceful error handling
- [ ] T277 [P] Add user-friendly error messages for all API errors in `packages/frontend/src/services/api/error-handler.ts`
- [ ] T278 [P] Add keyboard shortcuts for common actions (N = new card, / = search, Esc = close modal) documented in help dialog
- [ ] T279 [P] Add ARIA labels and semantic HTML for accessibility in all components - verify with axe-core
- [ ] T280 [P] Test responsive design on mobile/tablet breakpoints - adjust CSS for touch targets ≥44px

### Documentation & Testing

- [ ] T281 [P] Run quickstart.md validation - verify all commands work end-to-end from fresh clone
- [ ] T282 [P] Add Playwright E2E tests in `packages/frontend/test/e2e/` for critical user journeys (signup → create board → add cards → drag-drop)
- [ ] T283 [P] Generate API documentation from OpenAPI spec - host with Swagger UI at /api/docs
- [ ] T284 [P] Add JSDoc comments to all public APIs in backend and frontend
- [ ] T285 Run test coverage report - verify ≥80% overall, ≥90% for critical paths (auth, card move, WebSocket)
- [ ] T286 [P] Add developer documentation in `docs/` folder: architecture.md, contributing.md, deployment.md

### Constitution Compliance Verification

- [ ] T287 [P] **Code Quality**: Run ESLint with `--max-warnings 0`, Prettier check, TypeScript strict mode compilation - verify all pass
- [ ] T288 [P] **Code Complexity**: Run complexity analysis with `eslint-plugin-complexity` - verify all functions ≤10 cyclomatic complexity
- [ ] T289 [P] **Testing**: Run `pnpm test --coverage` - verify coverage ≥80% overall, ≥90% critical paths, all tests passing
- [ ] T290 [P] **Accessibility**: Run `axe-core` accessibility audit on all pages - verify WCAG 2.1 AA compliance
- [ ] T291 [P] **Performance**: Run Lighthouse performance audit - verify page load <3s, API p95 <200ms (use k6 load test)
- [ ] T292 [P] **Security**: Run `npm audit` and `pnpm audit` - resolve all high/critical vulnerabilities
- [ ] T293 Final review: Verify all constitution principles met and documented in plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
3. **User Story 3 - Real-time (Phase 3)**: Depends on Foundational - Implemented FIRST because WebSocket infrastructure affects all other stories
4. **User Story 1 - Create/Organize (Phase 4)**: Depends on Foundational + US3 (real-time infrastructure)
5. **User Story 2 - Card Details (Phase 5)**: Depends on Foundational + US1 (Card entity)
6. **User Story 4 - Organizations (Phase 6)**: Depends on Foundational + US1 (Board entity)
7. **User Story 6 - Assignments (Phase 7)**: Depends on Foundational + US1 (Card entity) + US4 (Organization members)
8. **User Story 5 - Search (Phase 8)**: Depends on Foundational + US1 (Card entity) + US2 (Labels for filtering)
9. **User Story 7 - Activity (Phase 9)**: Depends on ALL previous stories (logs all domain events)
10. **Polish (Phase 10)**: Depends on all desired user stories being complete

### Parallel Opportunities Within Phases

**Setup Phase**:

- T002 (backend init), T003 (frontend init), T004 (shared init) can run in parallel
- T005 (TypeScript), T006 (ESLint), T007 (Husky), T010 (env templates) can run in parallel

**Foundational Phase**:

- Database tasks T011-T014 can proceed independently
- Auth tasks T016 (entity), T017 (domain), T023 (DTOs) can run in parallel
- Redis tasks T024-T027 can proceed independently
- Error handling tasks T028-T030 can run in parallel

**User Story 1 Implementation**:

- All data layer entities T064-T069 can be created in parallel
- All domain models T071-T073, repositories T074-T076 can be created in parallel
- All command/query handlers T080-T088 can be created in parallel after domain layer
- All DTOs T094-T096 can be created in parallel
- Frontend API clients T102-T104 can be created in parallel
- Frontend components T107-T111 can be created in parallel

**User Story 2 Implementation**:

- All entities T123-T128 can be created in parallel
- All domain models T131-T134 can be created in parallel
- All command handlers T137-T143 can be created in parallel
- All DTOs T145-T148 can be created in parallel
- Frontend API clients T156-T159 can be created in parallel
- Frontend components T161-T166 can be created in parallel

**Polish Phase**:

- Most tasks marked [P] can run in parallel: performance, security, UX, documentation tasks are independent

### Critical Path (MVP)

To deliver minimum viable product (MVP):

```
Setup → Foundational → US3 (Real-time) → US1 (Create/Organize) → Polish → DEMO
```

This MVP allows users to:

- Register/login (Foundational)
- Create boards and lists (US1)
- Create and move cards (US1)
- See real-time updates when collaborating (US3)

Estimated: ~80 tasks for MVP (T001-T116 minus optional tasks)

### Full Feature Delivery

Complete all 7 user stories:

```
Setup → Foundational → US3 → US1 → US2 → US4 → US6 → US5 → US7 → Polish → RELEASE
```

Estimated: 293 total tasks

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Dev A**: US3 (Real-time) → US1 (Create/Organize) [Critical path]
- **Dev B**: US2 (Card Details) → US5 (Search) [Blocked until US1 done]
- **Dev C**: US4 (Organizations) → US6 (Assignments) [Blocked until US1 done]

Then everyone converges on US7 (Activity) and Polish.

---

## Implementation Strategy

### TDD Workflow (MANDATORY per Constitution)

For EVERY user story phase:

1. **Write Tests FIRST** (⚠️ tasks)
   - Contract tests for API endpoints
   - Integration tests for user journeys
   - Unit tests for business logic
2. **Verify Tests FAIL** (red phase)
3. **Implement to Pass Tests** (green phase)
4. **Refactor** while keeping tests green
5. **Verify Coverage** ≥80% before marking phase complete

### MVP-First Approach (Recommended)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks everything)
3. Complete Phase 3: User Story 3 (Real-time infrastructure)
4. Complete Phase 4: User Story 1 (Create/Organize)
5. **STOP and VALIDATE**: Test MVP independently
6. Deploy/demo to stakeholders
7. Gather feedback before building additional stories

### Incremental Delivery

After MVP, add stories one at a time in priority order:

1. US2 (Card Details) → Deploy → Demo
2. US4 (Organizations) → Deploy → Demo
3. US6 (Assignments) → Deploy → Demo
4. US5 (Search) → Deploy → Demo
5. US7 (Activity) → Deploy → Demo
6. Polish → Final release

Each story adds value without breaking previous stories.

---

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **[Story] label** = Maps task to specific user story for traceability
- **⚠️ symbol** = Test task (MANDATORY per constitution, write before implementation)
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD red-green-refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use feature flags if deploying incomplete stories to production
- Constitution compliance checks are in Phase 10 but should be verified continuously

---

## Task Count Summary

- **Phase 1 (Setup)**: 10 tasks
- **Phase 2 (Foundational)**: 27 tasks
- **Phase 3 (US3 - Real-time)**: 18 tasks (4 tests + 14 implementation)
- **Phase 4 (US1 - Create/Organize)**: 61 tasks (8 tests + 53 implementation)
- **Phase 5 (US2 - Card Details)**: 54 tasks (6 tests + 48 implementation)
- **Phase 6 (US4 - Organizations)**: 30 tasks (5 tests + 25 implementation)
- **Phase 7 (US6 - Assignments)**: 26 tasks (4 tests + 22 implementation)
- **Phase 8 (US5 - Search)**: 17 tasks (4 tests + 13 implementation)
- **Phase 9 (US7 - Activity)**: 21 tasks (3 tests + 18 implementation)
- **Phase 10 (Polish)**: 29 tasks (cross-cutting concerns)

**Total**: 293 tasks

**MVP Scope** (Setup + Foundational + US3 + US1): 116 tasks
**Essential Features** (MVP + US2 + US4): 200 tasks
**Full Feature Set** (All 7 stories + Polish): 293 tasks
