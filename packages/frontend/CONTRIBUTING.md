# Contributing to Trello-Vibe Frontend

Thank you for contributing to Trello-Vibe! This guide will help you get started with frontend development.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Component Guidelines](#component-guidelines)
- [Adding New Features](#adding-new-features)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Common Patterns](#common-patterns)

---

## Development Setup

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x or higher
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

### Initial Setup

1. **Clone the repository**:

```bash
git clone <repository-url>
cd trello-vibe-coding
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Set up environment variables**:

```bash
# In packages/frontend/
cp .env.example .env
# Edit .env with your local settings
```

4. **Start development servers**:

```bash
# Start both frontend and backend
pnpm dev

# Or start frontend only
cd packages/frontend
pnpm dev
```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `refactor/*` - Refactoring branches

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit frequently
git add .
git commit -m "feat: add user profile component"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(board): add board creation form
fix(card): resolve drag-and-drop position bug
docs(readme): update installation instructions
refactor(api): extract service layer pattern
test(hooks): add tests for useGetBoard hook
```

---

## Code Style Guide

### TypeScript Guidelines

1. **Use explicit types** (avoid `any`):

```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
const data: Board = await boardService.getBoard(id);
```

2. **Use interfaces for object shapes**:

```typescript
// ✅ Good
interface BoardHeaderProps {
  board: Board;
  onUpdate: (data: UpdateBoardDto) => void;
}
```

3. **Use type aliases for unions/complex types**:

```typescript
// ✅ Good
type Status = 'idle' | 'loading' | 'success' | 'error';
type ApiResponse<T> = { data: T; message?: string };
```

4. **Prefer `const` over `let`**:

```typescript
// ❌ Bad
let name = 'Board';

// ✅ Good
const name = 'Board';
```

### React Component Guidelines

1. **Use functional components with hooks**:

```typescript
// ✅ Good
export function Board({ boardId }: BoardProps) {
  const { data, loading } = useGetBoard(boardId);
  // ...
}
```

2. **Destructure props in function signature**:

```typescript
// ✅ Good
export function Card({ card, onUpdate }: CardProps) {
  // ...
}
```

3. **Use early returns for loading/error states**:

```typescript
// ✅ Good
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <BoardView board={data} />;
```

4. **Extract complex JSX to separate components**:

```typescript
// ❌ Bad - Complex nested JSX
return (
  <div>
    {/* 50+ lines of JSX */}
  </div>
);

// ✅ Good - Extracted components
return (
  <div>
    <BoardHeader board={board} />
    <BoardLists lists={lists} />
    <BoardFooter />
  </div>
);
```

### Naming Conventions

- **Components**: PascalCase (`BoardHeader`, `CardModal`)
- **Files**: PascalCase for components (`BoardHeader.tsx`), camelCase for utilities (`errors.ts`)
- **Functions**: camelCase (`fetchBoard`, `handleUpdate`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Hooks**: camelCase with `use` prefix (`useGetBoard`, `useAuth`)
- **Types/Interfaces**: PascalCase (`Board`, `CreateBoardDto`)

### File Structure

```typescript
// Component file structure:

// 1. Imports (external, then internal)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component definition
export function Component({ prop }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();
  const { data } = useQuery();

  // 5. Event handlers
  const handleClick = () => { /* ... */ };

  // 6. Effects
  useEffect(() => { /* ... */ }, []);

  // 7. Early returns
  if (loading) return <Spinner />;

  // 8. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## Component Guidelines

### Component Organization

Place components in appropriate directories:

- **Feature components**: `src/features/[feature]/components/`
- **Shared UI components**: `src/components/ui/`
- **Page components**: `src/pages/`
- **Layout components**: `src/layouts/`

### Component Documentation

Add JSDoc comments to all exported components:

````typescript
/**
 * Displays a kanban board with lists and cards
 *
 * @param board - The board data to display
 * @param onUpdate - Callback when board is updated
 *
 * @example
 * ```tsx
 * <Board board={boardData} onUpdate={handleUpdate} />
 * ```
 */
export function Board({ board, onUpdate }: BoardProps) {
  // ...
}
````

### Accessibility

Ensure all components are accessible (WCAG 2.1 AA):

1. **Use semantic HTML**:

```tsx
// ✅ Good
<button onClick={handleClick}>Click me</button>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
```

2. **Add ARIA labels when needed**:

```tsx
<button aria-label="Close modal" onClick={onClose}>
  <X />
</button>
```

3. **Ensure keyboard navigation works**:

```tsx
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSubmit();
  }}
/>
```

4. **Test with screen reader** (NVDA, JAWS, or VoiceOver)

---

## Adding New Features

### 1. Adding a New API Endpoint

**Step 1**: Add service method

```typescript
// src/services/api/board.service.ts
export const boardService = {
  // ... existing methods

  archiveBoard: async (id: string): Promise<void> => {
    await apiClient.post(`/boards/${id}/archive`);
  },
};
```

**Step 2**: Create custom hook

```typescript
// src/hooks/api/useArchiveBoard.ts
import { useState, useCallback } from 'react';
import { boardService } from '@/services/api/board.service';
import { useToast } from '@/hooks/common/useToast';

export function useArchiveBoard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const archiveBoard = useCallback(
    async (boardId: string) => {
      setLoading(true);
      setError(null);

      try {
        await boardService.archiveBoard(boardId);
        toast.success('Board archived successfully');
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error({
          title: 'Failed to archive board',
          description: error.message,
          action: {
            label: 'Retry',
            onClick: () => archiveBoard(boardId),
          },
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { archiveBoard, loading, error };
}
```

**Step 3**: Use in component

```typescript
// src/features/board/components/BoardHeader.tsx
import { useArchiveBoard } from '@/hooks/api/useArchiveBoard';

export function BoardHeader({ board }: BoardHeaderProps) {
  const { archiveBoard, loading } = useArchiveBoard();

  return (
    <Button
      onClick={() => archiveBoard(board.id)}
      disabled={loading}
    >
      Archive Board
    </Button>
  );
}
```

**Step 4**: Add tests

```typescript
// test/unit/hooks/useArchiveBoard.test.ts
import { renderHook, act } from '@testing-library/react';
import { useArchiveBoard } from '@/hooks/api/useArchiveBoard';
import { boardService } from '@/services/api/board.service';

vi.mock('@/services/api/board.service');

test('archives board successfully', async () => {
  vi.mocked(boardService.archiveBoard).mockResolvedValue();

  const { result } = renderHook(() => useArchiveBoard());

  await act(async () => {
    await result.current.archiveBoard('board-123');
  });

  expect(boardService.archiveBoard).toHaveBeenCalledWith('board-123');
});
```

### 2. Adding a New Feature Module

**Step 1**: Create directory structure

```bash
mkdir -p src/features/[feature-name]/{components,types}
touch src/features/[feature-name]/index.ts
```

**Step 2**: Add feature components

```typescript
// src/features/[feature-name]/components/FeatureComponent.tsx
import type { FeatureProps } from '../types/props';

export function FeatureComponent({ prop }: FeatureProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**Step 3**: Define prop types

```typescript
// src/features/[feature-name]/types/props.ts
export interface FeatureComponentProps {
  prop: string;
  onAction: () => void;
}
```

**Step 4**: Export from barrel file

```typescript
// src/features/[feature-name]/index.ts
export { FeatureComponent } from './components/FeatureComponent';
export type { FeatureComponentProps } from './types/props';
```

**Step 5**: Use in pages or other features

```typescript
import { FeatureComponent } from '@/features/[feature-name]';

<FeatureComponent prop="value" onAction={handleAction} />
```

### 3. Adding WebSocket Event Support

**Step 1**: Define event type

```typescript
// src/types/websocket.types.ts
export interface FeatureUpdatedEvent {
  type: 'feature:updated';
  featureId: string;
  changes: Partial<Feature>;
  updatedBy: string;
  timestamp: string;
}
```

**Step 2**: Add event handler to WebSocketService

```typescript
// src/services/websocket/WebSocketService.ts
// Event handlers are registered dynamically in hooks
```

**Step 3**: Create hook for real-time updates

```typescript
// src/hooks/websocket/useRealtimeFeature.ts
import { useEffect } from 'react';
import { webSocketService } from '@/services/websocket/WebSocketService';

export function useRealtimeFeature(featureId: string) {
  useEffect(() => {
    webSocketService.connect();
    webSocketService.joinFeature(featureId);

    const handleFeatureUpdated = (event: FeatureUpdatedEvent) => {
      // Update local state
      console.log('Feature updated:', event);
    };

    webSocketService.on('feature:updated', handleFeatureUpdated);

    return () => {
      webSocketService.off('feature:updated', handleFeatureUpdated);
      webSocketService.leaveFeature(featureId);
    };
  }, [featureId]);
}
```

---

## Testing Requirements

### Unit Tests

All new hooks and services **must** have unit tests:

```typescript
// test/unit/hooks/useFeature.test.ts
import { renderHook } from '@testing-library/react';
import { useFeature } from '@/hooks/api/useFeature';

describe('useFeature', () => {
  it('fetches feature data', async () => {
    // Test implementation
  });

  it('handles errors gracefully', async () => {
    // Test implementation
  });
});
```

**Coverage Requirements**:

- Hooks: 80% minimum
- Services: 90% minimum
- Utility functions: 95% minimum

### Integration Tests

Test component interactions with APIs and stores:

```typescript
// test/integration/feature/feature-component.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureComponent } from '@/features/feature/components/FeatureComponent';

describe('FeatureComponent', () => {
  it('displays feature data after loading', async () => {
    render(<FeatureComponent featureId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Feature Name')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

Test critical user flows end-to-end:

```typescript
// test/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a feature', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("New Feature")');
  await page.fill('input[name="name"]', 'Test Feature');
  await page.click('button:has-text("Create")');

  await expect(page.locator('h1')).toHaveText('Test Feature');
});
```

**E2E Test Requirements**:

- All critical user flows covered
- Test on multiple browsers (Chrome, Firefox, Safari/Edge)
- No flaky tests allowed (must pass 100% of the time)

---

## Pull Request Process

### Before Submitting

1. **Run all checks locally**:

```bash
pnpm lint        # ESLint
pnpm type-check  # TypeScript
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests (if applicable)
```

2. **Ensure code is formatted**:

```bash
pnpm format      # Prettier (if configured)
```

3. **Update documentation**:

- Update README.md if adding new features
- Add/update JSDoc comments
- Update relevant spec documents

4. **Write clear commit messages**:

- Follow Conventional Commits format
- Reference issue numbers (`fix: resolve card positioning (#123)`)

### PR Title & Description

**Title**: `<type>(<scope>): <description>`

**Description Template**:

```markdown
## Changes

- Added feature X
- Fixed bug Y
- Refactored Z

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots]

## Checklist

- [ ] Code follows style guidelines
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No console errors
- [ ] Accessibility tested
```

### Review Process

1. **Self-review**: Review your own PR first
2. **Automated checks**: Ensure CI passes
3. **Peer review**: Requires 1-2 approvals
4. **Address feedback**: Respond to all comments
5. **Merge**: Squash and merge to keep history clean

---

## Common Patterns

### Error Handling Pattern

```typescript
const { data, loading, error, refetch } = useGetBoard(boardId);

if (loading) return <Spinner />;
if (error) {
  return (
    <ErrorMessage
      error={error}
      onRetry={refetch}
      message="Failed to load board"
    />
  );
}

return <BoardView board={data} />;
```

### Toast Notification Pattern

```typescript
const toast = useToast();

try {
  await someOperation();
  toast.success('Operation successful');
} catch (error) {
  toast.error({
    title: 'Operation failed',
    description: error.message,
    action: {
      label: 'Retry',
      onClick: () => someOperation(),
    },
  });
}
```

### Optimistic Update Pattern

```typescript
const { mutate: updateCard } = useUpdateCard(cardId, {
  onMutate: async (newData) => {
    // Cancel ongoing queries
    // Save snapshot
    // Optimistically update UI
  },
  onError: (error, variables, context) => {
    // Rollback to snapshot
  },
  onSuccess: (data) => {
    // Confirm update
  },
});
```

### Form Handling Pattern

```typescript
const [formData, setFormData] = useState<FormData>({});
const { mutate, loading } = useCreateBoard();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await mutate(formData);
    onSuccess();
  } catch (error) {
    // Error handled by hook
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
    <Button type="submit" disabled={loading}>
      {loading ? 'Creating...' : 'Create'}
    </Button>
  </form>
);
```

---

## Getting Help

- **Slack**: #trello-vibe-dev channel
- **Issues**: Check existing GitHub issues or create new one
- **Documentation**: See `/specs/002-mvp-integration-refactor/` for detailed docs
- **Code Review**: Tag team members for guidance

---

## License

[Add license information]

---

Thank you for contributing to Trello-Vibe! 🚀
