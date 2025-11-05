# Contributing to Trello Vibe

Thank you for your interest in contributing to Trello Vibe! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

## Getting Started

### Prerequisites

- **Node.js**: v20.x LTS or higher
- **pnpm**: v8.x or higher
- **PostgreSQL**: v15 or higher
- **Redis**: v7 or higher
- **Git**: Latest version

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/llong2195/board-cher.git
   cd board-cher
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   # Backend
   cp packages/backend/.env.example packages/backend/.env
   # Edit .env with your configuration

   # Frontend
   cp packages/frontend/.env.example packages/frontend/.env
   ```

4. **Start databases**

   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**

   ```bash
   cd packages/backend
   pnpm run migration:run
   ```

6. **Start development servers**

   ```bash
   # Terminal 1: Backend
   cd packages/backend
   pnpm run start:dev

   # Terminal 2: Frontend
   cd packages/frontend
   pnpm run dev
   ```

7. **Verify setup**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:3000/api/docs

## Development Workflow

### Branch Strategy

We use **Git Flow** branching model:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Production hotfixes

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Commit your changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### Working on Issues

1. Check existing issues or create a new one
2. Assign yourself to the issue
3. Create a branch: `feature/issue-123-description`
4. Link your PR to the issue

## Coding Standards

### TypeScript Style Guide

#### General Rules

- **Use TypeScript strict mode**: All projects have `strict: true` in `tsconfig.json`
- **Avoid `any` types**: Use specific types or `unknown`
- **Use interfaces for objects**: Prefer interfaces over type aliases for object shapes
- **Use type inference**: Let TypeScript infer types when obvious

#### Naming Conventions

```typescript
// Classes: PascalCase
class BoardService {}

// Interfaces: PascalCase with 'I' prefix (backend only)
interface IBoardRepository {}

// Types: PascalCase
type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// Functions/Methods: camelCase
function createBoard() {}

// Constants: UPPER_SNAKE_CASE
const MAX_BOARDS_PER_ORG = 100;

// Variables: camelCase
const boardCount = 5;

// Private properties: camelCase with underscore prefix
private _cachedData: Data;
```

#### File Organization

```typescript
// 1. Imports (grouped and sorted)
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Board } from './board.model';

// 2. Interfaces/Types
interface CreateBoardDto {
  name: string;
  organizationId: string;
}

// 3. Constants
const DEFAULT_BOARD_COLOR = '#0079BF';

// 4. Class implementation
@Injectable()
export class BoardService {
  // Properties
  private readonly repository: Repository<Board>;

  // Constructor
  constructor(repository: Repository<Board>) {
    this.repository = repository;
  }

  // Public methods
  async createBoard(dto: CreateBoardDto): Promise<Board> {
    // Implementation
  }

  // Private methods
  private validateBoard(board: Board): boolean {
    // Implementation
  }
}
```

### Backend Conventions

#### Controllers

```typescript
@Controller('boards')
@UseGuards(JwtAuthGuard, BoardPermissionGuard)
export class BoardController {
  // Use DTOs for validation
  @Post()
  async create(@Body() dto: CreateBoardDto): Promise<BoardResponseDto> {
    // Implementation
  }

  // Use OpenAPI decorators
  @Get(':id')
  @ApiOperation({ summary: 'Get board by ID' })
  @ApiResponse({ status: 200, type: BoardResponseDto })
  async findOne(@Param('id') id: string): Promise<BoardResponseDto> {
    // Implementation
  }
}
```

#### Services (CQRS Pattern)

```typescript
// Commands (write operations)
@CommandHandler(CreateBoardCommand)
export class CreateBoardHandler {
  async execute(command: CreateBoardCommand): Promise<Board> {
    // 1. Validate input
    // 2. Check permissions
    // 3. Create entity
    // 4. Emit domain event
    // 5. Return result
  }
}

// Queries (read operations)
@QueryHandler(GetBoardQuery)
export class GetBoardHandler {
  async execute(query: GetBoardQuery): Promise<Board> {
    // 1. Fetch from repository
    // 2. Check permissions
    // 3. Return result
  }
}
```

### Frontend Conventions

#### Components

```typescript
// Use functional components with TypeScript
interface CardProps {
  card: Card;
  onUpdate: (card: Card) => void;
  className?: string;
}

export function Card({ card, onUpdate, className }: CardProps) {
  // Hooks first
  const [isEditing, setIsEditing] = useState(false);
  const { mutate } = useUpdateCard();

  // Event handlers
  const handleSave = () => {
    // Implementation
  };

  // Render
  return (
    <div className={cn('card', className)}>
      {/* JSX */}
    </div>
  );
}
```

#### State Management

```typescript
// Zustand stores
interface BoardStore {
  boards: Board[];
  selectedBoard: Board | null;
  actions: {
    fetchBoards: () => Promise<void>;
    selectBoard: (id: string) => void;
  };
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  selectedBoard: null,
  actions: {
    fetchBoards: async () => {
      const boards = await api.boards.list();
      set({ boards });
    },
    selectBoard: (id) => {
      const board = get().boards.find((b) => b.id === id);
      set({ selectedBoard: board });
    },
  },
}));
```

### CSS/Styling Conventions

- Use **Tailwind CSS utility classes**
- Use `cn()` helper for conditional classes
- Follow **mobile-first** approach
- Ensure **touch targets ≥44px**

```tsx
<button
  className={cn(
    'px-4 py-2 rounded-md',
    'bg-blue-600 hover:bg-blue-700',
    'text-white font-medium',
    'focus:outline-none focus:ring-2 focus:ring-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    className,
  )}
>
  {children}
</button>
```

## Testing Requirements

### Test-Driven Development (TDD)

We follow TDD principles:

1. **Write test first** (Red)
2. **Implement feature** (Green)
3. **Refactor code** (Refactor)

### Coverage Requirements

- **Minimum overall**: 80% coverage
- **Critical paths**: 90% coverage
  - Authentication
  - Card CRUD operations
  - WebSocket events
  - Permission checks

### Backend Testing

```typescript
// Unit tests
describe('BoardService', () => {
  it('should create a board', async () => {
    // Arrange
    const dto = { name: 'Test Board', organizationId: '123' };

    // Act
    const result = await service.create(dto);

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe(dto.name);
  });
});

// Integration tests
describe('BoardController (integration)', () => {
  it('POST /boards should create board', () => {
    return request(app.getHttpServer())
      .post('/boards')
      .send({ name: 'Test', organizationId: '123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

### Frontend Testing

```typescript
// Component tests
describe('Card component', () => {
  it('should render card title', () => {
    const card = { id: '1', title: 'Test Card' };
    render(<Card card={card} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should call onUpdate when edited', async () => {
    const onUpdate = vi.fn();
    render(<Card card={card} onUpdate={onUpdate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox'), 'New title');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Backend
cd packages/backend
pnpm test              # Unit tests
pnpm test:integration  # Integration tests
pnpm test:e2e         # E2E tests
pnpm test:cov         # With coverage

# Frontend
cd packages/frontend
pnpm test              # Unit tests
pnpm test:e2e         # E2E tests (Playwright)
```

## Pull Request Process

### Before Creating a PR

1. **Run linters**

   ```bash
   pnpm run lint
   pnpm run format
   ```

2. **Run tests**

   ```bash
   pnpm test
   ```

3. **Check types**

   ```bash
   pnpm run type-check
   ```

4. **Update documentation** if needed

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description is clear
- [ ] Screenshots included (for UI changes)

### PR Template

```markdown
## Description

Brief description of changes

## Related Issue

Closes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **At least one approval** required
3. **Address review comments**
4. **Squash and merge** when approved

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process or tooling
- `perf`: Performance improvement

### Examples

```bash
# Feature
feat(board): add drag-and-drop for cards

# Bug fix
fix(auth): resolve token expiration issue

# Documentation
docs(api): update authentication guide

# Refactor
refactor(card): extract validation logic to service
```

### Scope

Use package or feature name:

- `board`, `card`, `list`, `auth`, `user`, `org`
- `backend`, `frontend`, `shared`

## Architecture Decisions

### When to Create an ADR

Create an Architecture Decision Record (ADR) for:

- Technology choices
- Design pattern decisions
- Breaking changes
- Database schema changes

### ADR Template

```markdown
# ADR-001: Use PostgreSQL for primary database

## Status

Accepted

## Context

Need to choose a database...

## Decision

We will use PostgreSQL because...

## Consequences

Positive:

- Strong ACID guarantees
- Rich query capabilities

Negative:

- Requires more infrastructure
```

## Getting Help

- **Documentation**: Check `/docs` folder
- **API Docs**: http://localhost:3000/api/docs
- **Issues**: Search existing issues or create new one
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (UNLICENSED).

---

Thank you for contributing to Trello Vibe! 🎉
