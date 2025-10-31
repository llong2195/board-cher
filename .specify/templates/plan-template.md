# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Node.js 22.x, TypeScript 5.x]  
**Primary Dependencies**: [e.g., NestJS/Fastify, React, Shadcn/ui]  
**Storage**: [PostgreSQL]  
**Testing**: [Jest, Nestjs Testing Module]  
**Target Platform**: [web, iOS, Android]
**Project Type**: [single/web/mobile - determines source structure]
**Performance Goals**: [domain-specific, e.g., 10000 req/s, 10000 lines/sec]
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10000 users, 1000000 LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality & Maintainability**:
- [ ] TypeScript with strict mode enabled and configured
- [ ] ESLint and Prettier configured with pre-commit hooks
- [ ] SOLID principles and DDD patterns documented in architecture
- [ ] Code complexity limits enforced (max cyclomatic complexity: 10)
- [ ] Public API documentation strategy defined

**II. Test-First Development**:
- [ ] TDD workflow documented in plan
- [ ] Unit test coverage targets: 80% overall, 90% critical paths
- [ ] Integration test strategy for API, database, WebSocket, cross-service interactions
- [ ] E2E test plan for critical user journeys
- [ ] Performance test plan for stated requirements (e.g., 1000 req/s)

**III. User Experience Consistency**:
- [ ] Design system (shadcn/ui) integration planned
- [ ] Accessibility requirements (WCAG 2.1 AA) addressed
- [ ] Error handling strategy defined (user-friendly messages)
- [ ] Loading states and optimistic updates planned
- [ ] Responsive design approach documented

**IV. Performance & Scalability**:
- [ ] Performance budget defined (API <200ms p95, page load <3s, real-time <1s)
- [ ] Horizontal scaling strategy documented
- [ ] Database optimization plan (indexing, query optimization, connection pooling)
- [ ] Caching strategy defined (Redis integration)
- [ ] WebSocket scaling approach (Redis pub/sub)
- [ ] Pagination/lazy loading for large datasets

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
