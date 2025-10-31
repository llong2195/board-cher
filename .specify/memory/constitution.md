<!--
Sync Impact Report:
Version: 1.0.0 (Initial Constitution)
Date: 2025-10-31
Changes:
- Initial constitution established with 4 core principles
- Focus: Code Quality, Testing Standards, UX Consistency, Performance
- No template updates required (initial setup)
- Ready for: All speckit commands
-->

# Trello-Vibe-Coding Constitution

## Core Principles

### I. Code Quality & Maintainability (NON-NEGOTIABLE)

All code MUST adhere to strict quality standards to ensure long-term maintainability and team productivity.

**Rules**:

- TypeScript MUST be used with strict mode enabled; no `any` types without explicit justification
- ESLint and Prettier MUST be configured and enforced in pre-commit hooks
- Code MUST follow SOLID principles and established design patterns (DDD where applicable)
- Functions MUST be single-purpose with clear, descriptive names
- Maximum cyclomatic complexity: 10 per function; violations require refactoring or documented justification
- Code reviews MUST verify adherence to coding standards before merge
- Documentation MUST be provided for all public APIs, complex algorithms, and architectural decisions
- Technical debt MUST be tracked and addressed; every TODO/FIXME requires a linked issue

**Rationale**: High code quality reduces bugs, accelerates feature development, and enables confident refactoring. TypeScript's type safety catches errors at compile time rather than runtime. Consistent formatting and linting eliminate style debates and improve code readability across the team.

---

### II. Test-First Development (NON-NEGOTIABLE)

Testing is not optional; it is the foundation of reliable software delivery and confident iteration.

**Rules**:

- TDD cycle MUST be followed: Write test → Verify it fails → Implement → Verify it passes → Refactor
- Unit test coverage MUST meet minimum 80% for business logic; 90%+ for critical paths
- Every functional requirement in specs MUST have corresponding acceptance tests
- Integration tests MUST cover: API endpoints, database operations, WebSocket events, cross-service interactions
- E2E tests MUST cover critical user journeys (authentication, board creation, real-time collaboration)
- Tests MUST run in CI/CD pipeline; failing tests block merge
- Test data MUST be isolated; no shared state between tests
- Performance tests MUST validate stated performance requirements (e.g., 1000 req/s target)
- New features cannot be merged without tests; bug fixes MUST include regression tests

**Rationale**: Test-first development catches bugs early when they are cheapest to fix. Comprehensive test coverage enables confident refactoring and prevents regressions. Tests serve as living documentation of intended behavior and facilitate faster onboarding.

---

### III. User Experience Consistency

User interface and interaction patterns MUST be consistent, predictable, and delightful across the entire application.

**Rules**:

- Design system (shadcn/ui) MUST be used for all UI components; custom components require design review
- Visual hierarchy, spacing, and typography MUST follow established design tokens
- Accessibility MUST meet WCAG 2.1 AA standards: keyboard navigation, screen reader support, color contrast
- Error messages MUST be user-friendly, actionable, and never expose system internals
- Loading states MUST provide visual feedback for operations taking >200ms
- Optimistic updates MUST be used for real-time interactions with graceful rollback on failure
- Responsive design MUST support mobile, tablet, and desktop viewports
- User interactions MUST provide immediate feedback (<100ms perceived latency)
- Empty states MUST guide users toward their first action
- Confirmation dialogs MUST be used for destructive actions (delete board, remove member)

**Rationale**: Consistent UX reduces cognitive load, increases user satisfaction, and decreases support requests. Accessibility is both an ethical imperative and legal requirement. Fast, responsive interactions are essential for perceived performance even when backend operations take time.

---

### IV. Performance & Scalability

The application MUST be designed for performance and horizontal scalability from day one, not bolted on later.

**Rules**:

- Performance budget MUST be established and monitored: API response time p95 <200ms, page load <3s, real-time updates <1s latency
- Target throughput: 1000 requests/second sustained; architecture MUST support horizontal scaling
- Database queries MUST be optimized: proper indexing, query analysis, N+1 prevention
- Caching MUST be implemented for frequently accessed data using Redis
- WebSocket connections MUST scale across multiple instances using Redis pub/sub
- Large datasets MUST use pagination, lazy loading, or virtual scrolling
- File uploads MUST stream rather than buffer entirely in memory
- Connection pooling MUST be configured for database and Redis connections
- Performance monitoring and profiling MUST be built in from the start
- Inefficient operations (full table scans, unbounded queries) MUST be flagged in code review

**Rationale**: Performance is a feature, not an afterthought. Slow applications lose users and damage brand reputation. Designing for scalability from the beginning is exponentially cheaper than retrofitting. Real-time collaboration requires low-latency infrastructure to feel responsive.

---

## Quality Gates

All changes MUST pass these gates before being merged to the main branch.

**Pre-Merge Requirements**:

- All tests pass (unit, integration, E2E)
- Code coverage meets minimum thresholds (80% overall, 90% critical paths)
- ESLint and Prettier checks pass with zero warnings
- TypeScript compiles with zero errors in strict mode
- Code review approved by at least one team member
- Performance tests pass for affected components
- No security vulnerabilities in dependencies (automated scanning)
- Documentation updated for public API changes

**Code Review Checklist**:

- Adheres to constitution principles
- Tests are comprehensive and meaningful (not just coverage gaming)
- No unnecessary complexity or over-engineering
- Error handling is appropriate and user-friendly
- Performance implications considered
- Accessibility requirements met
- Security best practices followed

---

## Development Workflow

**Feature Development Process**:

1. Create feature spec using `/speckit.specify` (focus on WHAT and WHY)
2. Plan implementation using `/speckit.plan` (technical approach, HOW)
3. Break down into tasks using `/speckit.tasks`
4. Implement using TDD: Write test → Fail → Implement → Pass → Refactor
5. Verify against constitution principles and quality gates
6. Submit for code review with comprehensive test coverage
7. Address feedback and merge only when all gates pass

**Branch Strategy**:

- Feature branches: `###-feature-name` format
- Main branch is protected; requires PR approval
- Squash commits on merge to keep history clean

**Continuous Integration**:

- Run full test suite on every commit
- Performance tests on nightly builds
- Security scanning on dependencies weekly
- Code coverage reports tracked over time

---

## Governance

**Amendment Process**:

- Constitution changes require team consensus and documented rationale
- Breaking changes to principles require migration plan for existing code
- Version follows semantic versioning:
  - MAJOR: Breaking principle changes, removed requirements
  - MINOR: New principles added, expanded guidance
  - PATCH: Clarifications, typo fixes, non-breaking refinements

**Compliance Verification**:

- All PRs MUST reference constitution principles that apply
- Violations MUST be justified in writing and approved by tech lead
- Regular audits to ensure codebase compliance
- Constitution supersedes all other practices in case of conflict

**Living Document**:

- Constitution reviewed quarterly for relevance
- Team retrospectives may propose amendments
- Amendments logged with version, date, and rationale

**Version**: 1.0.0 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-10-31
