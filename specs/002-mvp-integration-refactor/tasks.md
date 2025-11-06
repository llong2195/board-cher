# Task Breakdown: MVP Integration Bug Fixes & Frontend Refactoring

**Feature**: 002-mvp-integration-refactor  
**Generated**: 2025-11-06  
**Based On**: spec.md, plan.md, research.md, data-model.md, contracts/

---

## Task Organization

Tasks are organized into phases by priority and dependencies:

- **Phase 1**: Project setup and infrastructure
- **Phase 2**: Foundational infrastructure (errors, API client, WebSocket)
- **Phase 3**: User Story 1 (P1) - Client-Backend Integration
- **Phase 4**: User Story 2 (P2) - Clean Code & Maintainability
- **Phase 5**: User Story 3 (P2) - Component Optimization
- **Phase 6**: Testing, documentation, and polish

**Legend**:

- `[P]` - Task can be executed in parallel with adjacent `[P]` tasks
- `[US1]` - User Story 1 (Seamless Client-Backend Communication)
- `[US2]` - User Story 2 (Clean and Maintainable Frontend Code)
- `[US3]` - User Story 3 (Optimized Component Architecture)

**Total Tasks**: 89
**Estimated Effort**: 40-50 hours

---

## Phase 1: Project Setup and Verification (2-3 hours)

**Goal**: Establish baseline, verify environment, create new folder structure

- [x] [T001] [P] Verify development environment setup (Node.js 20.x, pnpm, Git)
- [x] [T002] [P] Install/update dependencies to specified versions in `packages/frontend/package.json` (React 19.1.1, Vite 7.1.7, TypeScript 5.9.3, etc.)
- [ ] [T003] [P] Verify backend is running and accessible at API base URL
- [ ] [T004] [P] Run existing E2E tests to establish baseline functionality in `packages/frontend/test/e2e/`
- [x] [T005] Create new folder structure: `packages/frontend/src/features/` with subdirectories `board/`, `card/`, `list/`
- [x] [T006] [P] Create new folder structure: `packages/frontend/src/services/api/` and `packages/frontend/src/services/websocket/`
- [x] [T007] [P] Create new folder structure: `packages/frontend/src/hooks/api/`, `packages/frontend/src/hooks/websocket/`, `packages/frontend/src/hooks/common/`
- [x] [T008] [P] Create barrel exports: `packages/frontend/src/features/board/index.ts`, `packages/frontend/src/features/card/index.ts`, `packages/frontend/src/features/list/index.ts`
- [x] [T009] Create TypeScript types directory structure: `packages/frontend/src/types/` with files `board.types.ts`, `card.types.ts`, `list.types.ts`, `api.types.ts`, `websocket.types.ts`
- [x] [T010] Configure TypeScript path aliases in `packages/frontend/tsconfig.json` for `@/features/*`, `@/services/*`, `@/hooks/*`, `@/types/*`

---

## Phase 2: Foundational Infrastructure (8-10 hours)

**Goal**: Build core infrastructure that all features depend on

### Error Handling Infrastructure

- [x] [T011] Define error type hierarchy in `packages/frontend/src/types/error.types.ts` (AppError, ApiError, NetworkError, ValidationError, AuthError, PermissionError, NotFoundError, WebSocketError classes)
- [x] [T012] [P] Create type guards and utilities in `packages/frontend/src/lib/errors.ts` (isApiError, isNetworkError, isValidationError, getErrorMessage functions)
- [x] [T013] [P] Create ErrorBoundary component in `packages/frontend/src/components/ErrorBoundary.tsx` with fallback UI and reset functionality
- [x] [T014] Wrap App component with ErrorBoundary in `packages/frontend/src/main.tsx`

### API Client & HTTP Interceptors

- [x] [T015] Create axios client instance with configuration in `packages/frontend/src/services/api/client.ts` (base URL, timeout, headers, auth token interceptor)
- [x] [T016] Implement response interceptor with retry logic in `packages/frontend/src/services/api/client.ts` (shouldRetry function, exponential backoff, max 3 retries)
- [x] [T017] Implement error transformation in `packages/frontend/src/services/api/client.ts` (transformError function mapping axios errors to custom error types)
- [x] [T018] [P] Implement error logging utility in `packages/frontend/src/services/api/client.ts` (console logging, production Sentry integration placeholder)
- [x] [T019] Add authentication token management in `packages/frontend/src/services/api/client.ts` (request interceptor adding Bearer token from localStorage/auth context)

### Toast Notification System

- [x] [T020] Verify shadcn/ui Toast component is installed and configured in `packages/frontend/src/components/ui/`
- [x] [T021] Create custom useToast hook in `packages/frontend/src/hooks/common/useToast.ts` (success, error, info, warning methods with retry action support)
- [ ] [T022] Create ToastProvider wrapper component in `packages/frontend/src/providers/ToastProvider.tsx` (if needed for global toast state)

### WebSocket Service

- [x] [T023] Define WebSocket event types in `packages/frontend/src/types/websocket.types.ts` (WebSocketConnectionEvent, BoardUpdatedEvent, ListCreatedEvent, CardMovedEvent, etc. - 11 event interfaces)
- [x] [T024] Create WebSocketService singleton class in `packages/frontend/src/services/websocket/WebSocketService.ts` (connect, disconnect, on, off, emit, getConnectionStatus methods)
- [x] [T025] Implement connection management in WebSocketService (Socket.io initialization with auth, reconnection config, connection event handlers)
- [x] [T026] [P] Implement error handling in WebSocketService (connect_error, error event handlers with toast notifications)
- [x] [T027] [P] Implement room management in WebSocketService (board:join, board:leave, board:joined event handlers)
- [x] [T028] Create base useWebSocket hook in `packages/frontend/src/hooks/websocket/useWebSocket.ts` (connection status state, connect/disconnect effects, status return)
- [ ] [T029] Add WebSocket connection status indicator component in `packages/frontend/src/components/WebSocketStatus.tsx` (optional: show connection state in UI)

### Core TypeScript Types

- [x] [T030] [P] Define core entity interfaces in `packages/frontend/src/types/board.types.ts` (Board, BoardMember, CreateBoardDto, UpdateBoardDto)
- [x] [T031] [P] Define list entity interfaces in `packages/frontend/src/types/list.types.ts` (List, CreateListDto, UpdateListDto, ReorderListsDto)
- [x] [T032] [P] Define card entity interfaces in `packages/frontend/src/types/card.types.ts` (Card, CardAssignee, CreateCardDto, UpdateCardDto, MoveCardDto)
- [x] [T033] [P] Define label and supporting types in `packages/frontend/src/types/card.types.ts` (Label, LabelColor, Attachment, Comment, CreateCommentDto)
- [x] [T034] [P] Define API response wrappers in `packages/frontend/src/types/api.types.ts` (ApiResponse<T>, ApiError, PaginatedResponse<T>)
- [x] [T035] [P] Define hook state types in `packages/frontend/src/types/api.types.ts` (UseQueryResult<T>, UseMutationResult<TData, TVariables>)

---

## Phase 3: User Story 1 - Seamless Client-Backend Communication (P1) (12-15 hours)

**Goal**: Fix all integration bugs, establish reliable API communication and real-time updates

### Board API Services & Hooks

- [ ] [T036] [US1] Create board API service in `packages/frontend/src/services/api/board.service.ts` (getBoards, getBoard, createBoard, updateBoard, deleteBoard functions)
- [ ] [T037] [US1] Create useGetBoards hook in `packages/frontend/src/hooks/api/useGetBoards.ts` (query hook with data/loading/error/refetch state)
- [ ] [T038] [US1] [P] Create useGetBoard hook in `packages/frontend/src/hooks/api/useGetBoard.ts` (query hook with boardId parameter, auto-fetch on mount)
- [ ] [T039] [US1] [P] Create useCreateBoard hook in `packages/frontend/src/hooks/api/useCreateBoard.ts` (mutation hook with success toast, onSuccess callback)
- [ ] [T040] [US1] [P] Create useUpdateBoard hook in `packages/frontend/src/hooks/api/useUpdateBoard.ts` (mutation hook with optimistic update, rollback on error)
- [ ] [T041] [US1] [P] Create useDeleteBoard hook in `packages/frontend/src/hooks/api/useDeleteBoard.ts` (mutation hook with confirmation, success redirect)

### List API Services & Hooks

- [ ] [T042] [US1] Create list API service in `packages/frontend/src/services/api/list.service.ts` (createList, updateList, deleteList, reorderLists functions)
- [ ] [T043] [US1] [P] Create useCreateList hook in `packages/frontend/src/hooks/api/useCreateList.ts` (mutation hook with optimistic update, auto-position calculation)
- [ ] [T044] [US1] [P] Create useUpdateList hook in `packages/frontend/src/hooks/api/useUpdateList.ts` (mutation hook with optimistic update, rollback on error)
- [ ] [T045] [US1] [P] Create useDeleteList hook in `packages/frontend/src/hooks/api/useDeleteList.ts` (mutation hook with confirmation, optimistic removal)
- [ ] [T046] [US1] Create useReorderLists hook in `packages/frontend/src/hooks/api/useReorderLists.ts` (mutation hook with optimistic reorder, silent operation)

### Card API Services & Hooks

- [ ] [T047] [US1] Create card API service in `packages/frontend/src/services/api/card.service.ts` (getCard, createCard, updateCard, moveCard, deleteCard functions)
- [ ] [T048] [US1] [P] Create useCreateCard hook in `packages/frontend/src/hooks/api/useCreateCard.ts` (mutation hook with optimistic update, auto-position calculation)
- [x] [T049] [US1] [P] Create useUpdateCard hook in `packages/frontend/src/hooks/api/useUpdateCard.ts` (mutation hook with optimistic update, silent operation for minor updates)
- [x] [T050] [US1] Create useMoveCard hook in `packages/frontend/src/hooks/api/useMoveCard.ts` (mutation hook with optimistic update, drag-and-drop support)
- [x] [T051] [US1] [P] Create useDeleteCard hook in `packages/frontend/src/hooks/api/useDeleteCard.ts` (mutation hook with confirmation, optimistic removal)

### Real-Time Synchronization (WebSocket Events)

- [x] [T052] [US1] Implement board event handlers in WebSocketService (board:updated, board:member:joined, board:member:left)
- [x] [T053] [US1] [P] Implement list event handlers in WebSocketService (list:created, list:updated, list:deleted, lists:reordered)
- [x] [T054] [US1] [P] Implement card event handlers in WebSocketService (card:created, card:updated, card:moved, card:deleted)
- [x] [T055] [US1] Create useRealtimeBoardUpdates hook in `packages/frontend/src/hooks/websocket/useRealtimeBoardUpdates.ts` (subscribes to board-specific events, deduplication logic)
- [x] [T056] [US1] Implement event deduplication logic in useRealtimeBoardUpdates (skip events from current user using updatedBy.userId check)
- [x] [T057] [US1] Implement reconnection sync strategy in useWebSocket (refetch board data on reconnect event)

### Integration Testing

- [ ] [T058] [US1] Test board CRUD operations in browser (create, read, update, delete boards without errors)
- [ ] [T059] [US1] [P] Test list CRUD operations in browser (create, rename, reorder, delete lists)
- [ ] [T060] [US1] [P] Test card CRUD operations in browser (create, edit, move between lists, delete cards)
- [ ] [T061] [US1] Test real-time updates with multiple browser windows (verify WebSocket synchronization works)
- [ ] [T062] [US1] Test error handling flows (network errors show retry toast, validation errors show details)
- [ ] [T063] [US1] Test WebSocket reconnection (disconnect network, verify reconnecting toast, verify reconnect success toast)

---

## Phase 4: User Story 2 - Clean and Maintainable Frontend Code (P2) (8-10 hours)

**Goal**: Refactor components, organize by feature, establish consistent patterns

### Feature-Based Component Reorganization

- [ ] [T064] [US2] Move existing board-related components to `packages/frontend/src/features/board/components/` (BoardHeader, BoardMemberList, CreateBoardForm, etc.)
- [ ] [T065] [US2] [P] Move existing list-related components to `packages/frontend/src/features/list/components/` (ListContainer, ListHeader, CreateListForm, etc.)
- [ ] [T066] [US2] [P] Move existing card-related components to `packages/frontend/src/features/card/components/` (CardItem, CardDetail, CreateCardForm, EditCardForm, etc.)
- [ ] [T067] [US2] Update import paths in page components to use new feature locations (BoardPage, HomePage imports from @/features/\*)
- [ ] [T068] [US2] Update barrel exports in feature index files (export only public components from features/board/index.ts, features/card/index.ts, features/list/index.ts)

### Component Prop Type Definitions

- [ ] [T069] [US2] [P] Define component prop interfaces in `packages/frontend/src/features/board/types/props.ts` (BoardHeaderProps, CreateBoardFormProps, etc.)
- [ ] [T070] [US2] [P] Define component prop interfaces in `packages/frontend/src/features/list/types/props.ts` (ListContainerProps, ListHeaderProps, etc.)
- [ ] [T071] [US2] [P] Define component prop interfaces in `packages/frontend/src/features/card/types/props.ts` (CardItemProps, CreateCardFormProps, etc.)
- [ ] [T072] [US2] Update all feature components to use defined prop interfaces (replace inline types with imported interfaces)

### Router Refactoring

- [ ] [T073] [US2] Consolidate route definitions in `packages/frontend/src/App.tsx` (all Routes in single Routes component)
- [ ] [T074] [US2] Implement lazy loading for page components in `packages/frontend/src/App.tsx` (use React.lazy() for HomePage, BoardPage, NotFoundPage)
- [ ] [T075] [US2] Add Suspense wrapper with loading fallback in `packages/frontend/src/App.tsx` (PageLoader component)
- [ ] [T076] [US2] [P] Implement 404 NotFound route handling in `packages/frontend/src/App.tsx` (catch-all route with NotFoundPage)
- [ ] [T077] [US2] [P] Add route protection/guards if needed in `packages/frontend/src/App.tsx` (ProtectedRoute wrapper for authenticated routes)

### Code Quality Cleanup

- [ ] [T078] [US2] Remove all unused imports across frontend codebase (use IDE or ESLint auto-fix)
- [ ] [T079] [US2] Remove all unused variables and dead code (ESLint no-unused-vars rule check)
- [ ] [T080] [US2] Fix all ESLint errors and warnings in `packages/frontend/src/` (run `pnpm lint --fix`)
- [ ] [T081] [US2] Format all code with Prettier in `packages/frontend/src/` (run `pnpm format`)
- [ ] [T082] [US2] Remove all `any` types except documented exceptions (TypeScript strict mode compliance check)

---

## Phase 5: User Story 3 - Optimized Component Architecture (P2) (6-8 hours)

**Goal**: Extract reusable components, minimize re-renders, improve performance

### Reusable Component Extraction

- [ ] [T083] [US3] Audit components for reuse opportunities (identify components used in 3+ places or highly reusable patterns)
- [ ] [T084] [US3] Extract common dialog patterns to `packages/frontend/src/components/ui/ConfirmDialog.tsx` (reusable confirmation dialog with variant support)
- [ ] [T085] [US3] [P] Extract common loading patterns to `packages/frontend/src/components/ui/LoadingSpinner.tsx` (reusable spinner with size variants)
- [ ] [T086] [US3] [P] Extract common form input wrappers if needed in `packages/frontend/src/components/ui/FormInput.tsx` (consistent input styling and error display)
- [ ] [T087] [US3] Update feature components to use extracted shared components (replace duplicate code with imports from components/ui/)

### Performance Optimization

- [ ] [T088] [US3] Add React.memo to expensive components (components with complex rendering or frequent parent re-renders)
- [ ] [T089] [US3] Optimize card drag-and-drop rendering (ensure only moved card re-renders, not entire list)
- [ ] [T090] [US3] Profile component re-renders with React DevTools (identify and fix unnecessary re-renders)
- [ ] [T091] [US3] [P] Implement useCallback for event handlers in parent components (prevent child re-renders from new function references)
- [ ] [T092] [US3] [P] Implement useMemo for expensive computations (filtered/sorted lists, computed values)

### Component Documentation

- [ ] [T093] [US3] [P] Add JSDoc comments to all shared UI components in `packages/frontend/src/components/ui/` (describe props, usage, examples)
- [ ] [T094] [US3] [P] Add JSDoc comments to all feature component public APIs (exported components in features/\*/index.ts)
- [ ] [T095] [US3] Document component hierarchy and data flow in `specs/002-mvp-integration-refactor/quickstart.md` (update Component Organization section)

---

## Phase 6: Testing, Documentation, and Polish (6-8 hours)

**Goal**: Ensure quality, verify requirements, prepare for merge

### Unit Testing

- [ ] [T096] Write unit tests for API hooks in `packages/frontend/test/unit/hooks/` (useGetBoard, useCreateCard, useMoveCard tests with React Testing Library)
- [ ] [T097] [P] Write unit tests for API services in `packages/frontend/test/unit/services/` (boardService, cardService, listService tests with mocked axios)
- [ ] [T098] [P] Write unit tests for WebSocket hooks in `packages/frontend/test/unit/hooks/` (useWebSocket, useRealtimeBoardUpdates with mocked Socket.io)
- [ ] [T099] [P] Write unit tests for error utilities in `packages/frontend/test/unit/lib/` (isApiError, getErrorMessage, transformError tests)

### End-to-End Testing

- [ ] [T100] Update existing E2E tests for new component locations in `packages/frontend/test/e2e/` (update selectors and paths if needed)
- [ ] [T101] [P] Add E2E test for board CRUD flow in `packages/frontend/test/e2e/board.spec.ts` (create board, view board, update name, delete board)
- [ ] [T102] [P] Add E2E test for card movement flow in `packages/frontend/test/e2e/card.spec.ts` (drag card between lists, verify position update)
- [ ] [T103] Add E2E test for real-time updates in `packages/frontend/test/e2e/realtime.spec.ts` (multi-browser test: user A creates card, user B sees update)
- [ ] [T104] Add E2E test for error handling in `packages/frontend/test/e2e/errors.spec.ts` (disconnect network, verify toast, reconnect, verify success)
- [ ] [T105] Run full E2E test suite and fix any failures (Playwright run all specs)

### Requirements Verification

- [ ] [T106] Verify FR-001 to FR-007 (Integration & Bug Fixes): Test all CRUD operations, error handling, WebSocket connection
- [ ] [T107] [P] Verify FR-008 to FR-012a (API Layer): Check centralized services, consistent error handling, custom hooks pattern
- [ ] [T108] [P] Verify FR-013 to FR-017 (Router): Check route configuration, lazy loading, 404 handling
- [ ] [T109] [P] Verify FR-018 to FR-023a (Component Refactoring): Check feature-based structure, naming conventions, Trello-style layout
- [ ] [T110] [P] Verify FR-024 to FR-028 (WebSocket): Check centralized service, reconnection, cleanup, typed events
- [ ] [T111] [P] Verify FR-029 to FR-032 (Code Quality): Run ESLint, check TypeScript strict mode, verify no unused code
- [ ] [T112] Verify SC-001 to SC-010 (Success Criteria): Test all kanban operations, check load time, verify real-time updates, run linting

### Documentation

- [ ] [T113] Update quickstart guide with final implementation details in `specs/002-mvp-integration-refactor/quickstart.md` (update code examples, folder structure)
- [ ] [T114] [P] Document any deviations from original plan in `specs/002-mvp-integration-refactor/IMPLEMENTATION-NOTES.md` (create file with lessons learned, challenges, solutions)
- [ ] [T115] [P] Update main README with new architecture overview in `packages/frontend/README.md` (add section on feature-based structure, API patterns)
- [ ] [T116] Create developer onboarding checklist in `packages/frontend/CONTRIBUTING.md` (how to add new feature, how to add new API endpoint)

### Final Verification

- [ ] [T117] Run full test suite (unit + E2E) and verify 100% pass rate
- [ ] [T118] [P] Run Lighthouse audit for performance in Chrome DevTools (verify page load <2s, API response <200ms)
- [ ] [T119] [P] Manual QA pass through all user stories in spec.md (verify all acceptance scenarios work)
- [ ] [T120] Verify zero ESLint errors/warnings in frontend codebase (run `pnpm lint` with no output)
- [ ] [T121] Verify TypeScript compilation with no errors (run `pnpm type-check`)
- [ ] [T122] Check for console errors in browser during normal operations (clean console during full workflow)
- [ ] [T123] Test on multiple browsers (Chrome, Firefox, Safari/Edge) for compatibility
- [ ] [T124] Prepare pull request description with summary, screenshots, testing notes
- [ ] [T125] Request code review from team members

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Infrastructure)
    ├─→ T011-T014 (Errors) → Used by all hooks
    ├─→ T015-T019 (API Client) → Used by all services
    ├─→ T020-T022 (Toast) → Used by all hooks
    ├─→ T023-T029 (WebSocket) → Used in Phase 3 real-time
    └─→ T030-T035 (Types) → Used by all services and hooks
    ↓
Phase 3 (US1 - P1 - CRITICAL)
    ├─→ T036-T041 (Board API) → Must complete first
    ├─→ T042-T046 (List API) → Depends on Board
    ├─→ T047-T051 (Card API) → Depends on List
    └─→ T052-T063 (Real-time) → Depends on all APIs
    ↓
Phase 4 (US2 - P2) and Phase 5 (US3 - P2) can run in parallel
    ├─→ Phase 4 (US2 - Clean Code)
    │   ├─→ T064-T068 (Component Reorg) → Can start after Phase 3
    │   ├─→ T069-T072 (Prop Types) → Parallel with reorg
    │   ├─→ T073-T077 (Router) → Parallel with reorg
    │   └─→ T078-T082 (Code Quality) → After reorg complete
    │
    └─→ Phase 5 (US3 - Optimization)
        ├─→ T083-T087 (Component Extraction) → After Phase 4 reorg
        ├─→ T088-T092 (Performance) → After extraction
        └─→ T093-T095 (Documentation) → Parallel with performance
    ↓
Phase 6 (Testing & Documentation)
    └─→ T096-T125 (All final tasks) → After Phases 4 & 5 complete
```

---

## Parallel Execution Opportunities

**Phase 2** (after setup):

- Error types + API client + Toast system + WebSocket + Core types = 5 parallel work streams

**Phase 3** (after Phase 2):

- Board hooks, List hooks, Card hooks can be developed in parallel by different developers
- Event handlers can be developed in parallel with hooks

**Phase 4 & 5** (after Phase 3):

- Entire Phase 4 and Phase 5 can run in parallel (different work streams)

**Phase 6**:

- Unit tests, E2E tests, documentation can be written in parallel

**Maximum Parallelism**: 3-4 developers can work simultaneously without blocking each other

---

## Progress Tracking

Use this template to track progress:

```markdown
## Sprint 1: Infrastructure (Phases 1-2)

- [ ] Phase 1 complete (10 tasks)
- [ ] Phase 2 complete (25 tasks)

## Sprint 2: Core Integration (Phase 3)

- [ ] Board API complete (6 tasks)
- [ ] List API complete (5 tasks)
- [ ] Card API complete (5 tasks)
- [ ] Real-time sync complete (12 tasks)

## Sprint 3: Refactoring (Phases 4-5)

- [ ] Component reorganization complete (23 tasks)
- [ ] Optimization complete (13 tasks)

## Sprint 4: Testing & Launch (Phase 6)

- [ ] All tests passing (30 tasks)
- [ ] Documentation updated
- [ ] Ready for merge
```

---

## Notes for Implementation

### High-Risk Areas

1. **WebSocket reconnection logic** - Test thoroughly with network interruption
2. **Optimistic updates rollback** - Ensure state consistency on API failures
3. **Drag-and-drop performance** - Profile with React DevTools, optimize re-renders
4. **Type safety migrations** - May uncover hidden bugs when removing `any` types

### Quick Wins

1. Start with error infrastructure (T011-T014) - enables better debugging immediately
2. Implement toast notifications early (T020-T022) - improves developer experience
3. Set up types first (T030-T035) - enables autocomplete and type checking for all subsequent work

### Testing Strategy

- Write unit tests as you build (don't defer to end)
- Test error paths as thoroughly as happy paths
- Use React DevTools Profiler for performance optimization
- Run E2E tests after each phase completion

---

## Acceptance Criteria Summary

**Phase 3 (US1 - P1) Acceptance**:

- ✅ All kanban operations work without console errors
- ✅ Real-time updates appear in other browser windows
- ✅ Error toasts show with retry buttons
- ✅ WebSocket reconnection works (disconnect/reconnect network test)

**Phase 4 (US2 - P2) Acceptance**:

- ✅ All components organized by feature
- ✅ Zero ESLint errors/warnings
- ✅ All imports use path aliases
- ✅ All routes use lazy loading

**Phase 5 (US3 - P2) Acceptance**:

- ✅ No duplicate component code
- ✅ React DevTools shows minimal re-renders
- ✅ All shared components documented with JSDoc

**Final (Phase 6) Acceptance**:

- ✅ All 32 functional requirements verified
- ✅ All 10 success criteria met
- ✅ Test coverage >80%
- ✅ All E2E tests passing

---

**Total Tasks**: 125  
**Phases**: 6  
**User Stories**: 3 (1 P1, 2 P2)  
**Estimated Duration**: 40-50 hours (2-3 weeks with 1-2 developers)

**Next Steps**:

1. Review this task breakdown with team
2. Assign tasks to developers
3. Start with Phase 1 setup tasks
4. Begin Phase 2 infrastructure in parallel work streams
