# trello-vibe-coding Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-31

## Active Technologies

- TypeScript 5.3+, Node.js 20.x LTS + NestJS 10.x, React 18.x, TypeORM 0.3.x, ioredis 5.x, Socket.io 4.x, shadcn/ui (001-kanban-board)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.3+, Node.js 20.x LTS: Follow standard conventions

## Constitution Principles

**CRITICAL**: All development MUST comply with `.specify/memory/constitution.md`

**Key Requirements**:
- TypeScript strict mode with ESLint/Prettier pre-commit hooks
- TDD mandatory: Write tests first, minimum 80% coverage
- Accessibility: WCAG 2.1 AA compliance required
- Performance: <200ms API p95, <3s page load, <1s real-time updates
- Design system: Use shadcn/ui components consistently

## Recent Changes

- 001-kanban-board: Added TypeScript 5.3+, Node.js 20.x LTS + NestJS 10.x, React 18.x, TypeORM 0.3.x, ioredis 5.x, Socket.io 4.x, shadcn/ui

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
