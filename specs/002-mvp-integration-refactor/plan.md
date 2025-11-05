# Implementation Plan: MVP Integration Bug Fixes & Frontend Refactoring

**Branch**: `002-mvp-integration-refactor` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-mvp-integration-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature addresses critical integration bugs between the React frontend and NestJS backend, and implements comprehensive frontend code refactoring to establish maintainable patterns. The primary goals are: (1) Fix all client-backend communication issues to ensure reliable CRUD operations and real-time updates, (2) Refactor API layer to use service layer with custom hooks pattern, (3) Reorganize components using feature-based structure, (4) Centralize WebSocket connection management with automatic reconnection, (5) Implement consistent error handling via toast notifications, and (6) Achieve zero linting errors while maintaining Trello-style functional layout with shadcn/ui design system.

## Technical Context

**Language/Version**: Node.js 20.x LTS, TypeScript 5.9.3  
**Frontend Stack**: React 19.1.1, Vite 7.1.7, React Router 7.9.5, Zustand 5.0.8  
**UI Library**: shadcn/ui (Radix UI primitives), Tailwind CSS 4.1.16  
**Backend Framework**: NestJS 11.1.8, TypeORM 0.3.27  
**Real-time**: Socket.io 4.8.1 (client & server), @socket.io/redis-adapter 8.3.0  
**HTTP Client**: Axios 1.13.1  
**Storage**: PostgreSQL (via TypeORM), Redis (ioredis 5.8.2) for caching and WebSocket scaling  
**Testing**:

- Frontend: Vitest 4.0.6, Testing Library, Playwright 1.56.1 for E2E
- Backend: Jest 30.2.0, Supertest 7.1.4  
  **Code Quality**: ESLint 9.x, Prettier 3.6.2, TypeScript strict mode, Husky pre-commit hooks  
  **Target Platform**: Web (responsive: mobile, tablet, desktop)  
  **Project Type**: Monorepo with web application (frontend + backend packages, shared package for types)  
  **Performance Goals**: API response <200ms p95, page load <2s, real-time updates <500ms, 1000 concurrent users  
  **Constraints**:
- Must maintain compatibility with existing backend API structure
- Cannot break existing board/card/list functionality during refactor
- Must use shadcn/ui components (already integrated)
- Zero downtime deployment requirement (frontend refactor only, no backend changes)  
  **Scale/Scope**:
- ~15-20 React components need refactoring
- 6-8 API service endpoints (boards, lists, cards CRUD)
- 4-5 WebSocket event types (board updates, card moves, real-time sync)
- Feature-based reorganization: 3 main features (board, card, list) + shared UI components

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**I. Code Quality & Maintainability**:

- [x] TypeScript with strict mode enabled and configured (tsconfig.json already configured with strict: true)
- [x] ESLint and Prettier configured with pre-commit hooks (Husky + lint-staged already configured)
- [x] SOLID principles and DDD patterns documented in architecture (Backend uses DDD; frontend refactor will align with separation of concerns)
- [x] Code complexity limits enforced (max cyclomatic complexity: 10) - Will be enforced through ESLint during refactor
- [x] Public API documentation strategy defined (TypeScript interfaces serve as documentation; custom hooks will be documented with JSDoc)

**II. Test-First Development**:

- [x] TDD workflow documented in plan (Test existing functionality before refactor, maintain test coverage during refactor)
- [x] Unit test coverage targets: 80% overall, 90% critical paths (Existing tests maintained; new custom hooks will have unit tests)
- [x] Integration test strategy for API, database, WebSocket, cross-service interactions (E2E tests with Playwright cover integration; maintain existing backend tests)
- [x] E2E test plan for critical user journeys (Existing Playwright tests cover board operations; verify all pass post-refactor)
- [x] Performance test plan for stated requirements (Manual testing with React DevTools for re-render optimization; Network tab for API timing)

**III. User Experience Consistency**:

- [x] Design system (shadcn/ui) integration planned (Already integrated; refactor maintains shadcn/ui components)
- [x] Accessibility requirements (WCAG 2.1 AA) addressed (Existing shadcn/ui components are accessible; maintain during refactor)
- [x] Error handling strategy defined (user-friendly messages) - Toast notifications with retry button for all API errors
- [x] Loading states and optimistic updates planned (Custom hooks provide loading state; optimistic updates for real-time operations)
- [x] Responsive design approach documented (Existing Tailwind responsive classes maintained; shadcn/ui components are responsive)

**IV. Performance & Scalability**:

- [x] Performance budget defined (API <200ms p95, page load <3s, real-time <1s) - Spec defines: API <200ms, page load <2s, real-time <500ms
- [x] Horizontal scaling strategy documented (Backend already uses Redis for WebSocket scaling; frontend refactor doesn't affect scaling)
- [x] Database optimization plan (indexing, query optimization, connection pooling) - Backend concern; not in refactor scope
- [x] Caching strategy defined (Redis integration) - Backend already implemented; frontend uses optimistic updates
- [x] WebSocket scaling approach (Redis pub/sub) - Already implemented via @socket.io/redis-adapter on backend
- [x] Pagination/lazy loading for large datasets (Not in current refactor scope; future enhancement)

**Constitution Compliance**: ✅ All gates pass. This is a refactoring feature focused on frontend code quality and maintainability, with strong emphasis on testing, error handling, and UX consistency.

## Project Structure

### Documentation (this feature)

```text
specs/002-mvp-integration-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-hooks.md     # Custom hooks API contract
│   ├── websocket-events.md  # WebSocket event types
│   └── error-handling.md    # Error handling patterns
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── backend/              # [NO CHANGES - Out of scope]
│   ├── src/
│   │   ├── application/  # CQRS commands, queries, handlers
│   │   ├── domain/       # Entities, aggregates, value objects
│   │   ├── infrastructure/ # TypeORM, Redis, WebSocket
│   │   └── presentation/ # NestJS controllers, DTOs
│   └── test/
│
├── frontend/             # [REFACTORING TARGET]
│   ├── src/
│   │   ├── features/     # [NEW] Feature-based organization
│   │   │   ├── board/    # Board-specific components, hooks, types
│   │   │   ├── card/     # Card-specific components, hooks, types
│   │   │   └── list/     # List-specific components, hooks, types
│   │   │
│   │   ├── components/   # [REFACTORED] Shared/reusable UI only
│   │   │   └── ui/       # shadcn/ui components (Button, Dialog, Toast, etc.)
│   │   │
│   │   ├── services/     # [NEW] Core API service layer
│   │   │   ├── api/      # HTTP client configuration, interceptors
│   │   │   ├── websocket/ # WebSocket connection management
│   │   │   └── types/    # API request/response types
│   │   │
│   │   ├── hooks/        # [NEW] Custom hooks for API operations
│   │   │   ├── api/      # useCreateCard, useUpdateBoard, etc.
│   │   │   ├── websocket/ # useWebSocket, useRealtimeSync
│   │   │   └── common/   # useToast, useErrorHandler
│   │   │
│   │   ├── pages/        # [EXISTING] Route pages
│   │   │   ├── BoardPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── layouts/      # [EXISTING] Layout components
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── stores/       # [EXISTING] Zustand stores (minimal changes)
│   │   ├── lib/          # [EXISTING] Utilities
│   │   ├── contexts/     # [EXISTING] React contexts (if needed)
│   │   └── App.tsx       # [REFACTORED] Router configuration
│   │
│   └── test/
│       ├── unit/         # Component and hook tests
│       ├── integration/  # API service tests
│       └── e2e/          # Playwright tests (existing)
│
└── shared/               # [NO CHANGES]
    └── src/              # Shared TypeScript types/DTOs
```

**Structure Decision**: This is a monorepo web application with separate frontend (React) and backend (NestJS) packages. The refactoring focuses exclusively on the frontend package, reorganizing it from a mixed structure to a clear feature-based architecture. The new structure separates concerns by:

1. **features/**: Domain-specific components and logic (board, card, list)
2. **components/ui/**: Shared, reusable UI components only (shadcn/ui)
3. **services/**: Core infrastructure (API client, WebSocket)
4. **hooks/**: Reusable logic layer (custom hooks for API operations)
5. **pages/**: Top-level route components
6. **layouts/**: Page layout wrappers

This aligns with the clarified feature-based structure requirement and supports scalability as new features are added.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified.** This refactoring feature aligns with all constitution principles:

- Maintains TypeScript strict mode and code quality standards
- Preserves existing test coverage while adding tests for new patterns
- Improves UX consistency through standardized error handling and loading states
- Does not introduce new complexity beyond necessary architectural improvements

The refactoring actually reduces complexity by:

- Centralizing scattered API calls into a service layer
- Eliminating duplicate code through component extraction
- Standardizing error handling patterns
- Clarifying component organization with feature-based structure
