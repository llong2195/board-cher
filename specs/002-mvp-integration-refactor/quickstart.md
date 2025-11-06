# Quickstart Guide: MVP Integration Bug Fixes & Frontend Refactoring

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Purpose**: Quick reference for developers implementing this refactoring

## Overview

This guide provides a quick reference for developers working on the frontend refactoring. For detailed specifications, see:

- [plan.md](./plan.md) - Full implementation plan
- [research.md](./research.md) - Technical decisions and rationale
- [data-model.md](./data-model.md) - TypeScript types and interfaces
- [contracts/](./contracts/) - API hooks, WebSocket events, error handling

---

## Quick Setup

### 1. Branch & Environment

```bash
# Already on branch 002-mvp-integration-refactor
git pull origin 002-mvp-integration-refactor

# Install dependencies
pnpm install

# Start development servers
pnpm dev  # Starts both frontend and backend
```

### 2. Verify Current Setup

```bash
# Check frontend
cd packages/frontend
pnpm dev  # Should start on http://localhost:5173

# Check backend (separate terminal)
cd packages/backend
pnpm dev  # Should start on http://localhost:3000
```

---

## Architecture Overview

### New Frontend Structure

```
packages/frontend/src/
├── features/              # [NEW] Feature-based organization
│   ├── board/
│   │   ├── components/    # Board-specific components
│   │   ├── hooks/         # Board-specific hooks
│   │   ├── types/         # Board-specific types
│   │   └── index.ts       # Public exports
│   ├── card/
│   └── list/
│
├── services/              # [NEW] Infrastructure services
│   ├── api/
│   │   ├── client.ts      # Axios instance with interceptors
│   │   ├── board.service.ts
│   │   ├── card.service.ts
│   │   └── list.service.ts
│   └── websocket/
│       └── WebSocketService.ts
│
├── hooks/                 # [NEW] Shared custom hooks
│   ├── api/               # API operation hooks
│   │   ├── useGetBoard.ts
│   │   ├── useCreateCard.ts
│   │   └── ...
│   ├── websocket/
│   │   └── useWebSocket.ts
│   └── common/
│       ├── useToast.ts
│       └── useErrorHandler.ts
│
├── components/ui/         # [EXISTING] shadcn/ui components only
├── pages/                 # [EXISTING] Route pages
├── layouts/               # [EXISTING] Layout components
└── App.tsx                # [REFACTORED] Router configuration
```

---

## Key Patterns

### 1. API Service Layer

**Location**: `src/services/api/`

**Pattern**: Pure TypeScript functions

```typescript
// src/services/api/board.service.ts
import { apiClient } from './client';
import type { Board, CreateBoardDto } from '@/types';

export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    const response = await apiClient.get<ApiResponse<Board[]>>('/boards');
    return response.data.data;
  },

  getBoard: async (id: string): Promise<Board> => {
    const response = await apiClient.get<ApiResponse<Board>>(`/boards/${id}`);
    return response.data.data;
  },

  createBoard: async (data: CreateBoardDto): Promise<Board> => {
    const response = await apiClient.post<ApiResponse<Board>>('/boards', data);
    return response.data.data;
  },

  // ... more methods
};
```

---

### 2. Custom Hooks for API Operations

**Location**: `src/hooks/api/`

**Pattern**: React hooks wrapping service functions

```typescript
// src/hooks/api/useGetBoard.ts
import { useState, useEffect } from 'react';
import { boardService } from '@/services/api/board.service';
import type { Board } from '@/types';

export function useGetBoard(boardId: string) {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBoard = async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);

    try {
      const board = await boardService.getBoard(boardId);
      setData(board);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  return {
    data,
    loading,
    error,
    refetch: fetchBoard,
  };
}
```

---

### 3. Mutation Hooks with Toast Notifications

```typescript
// src/hooks/api/useCreateBoard.ts
import { useState } from 'react';
import { boardService } from '@/services/api/board.service';
import { useToast } from '@/hooks/common/useToast';
import type { Board, CreateBoardDto } from '@/types';

export function useCreateBoard() {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = async (input: CreateBoardDto): Promise<Board> => {
    setLoading(true);
    setError(null);

    try {
      const board = await boardService.createBoard(input);
      setData(board);
      toast.success('Board created successfully');
      return board;
    } catch (err) {
      const error = err as Error;
      setError(error);

      toast.error({
        title: 'Failed to create board',
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => mutate(input),
        },
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, data, loading, error };
}
```

---

### 4. Feature-Based Components

**Location**: `src/features/[feature-name]/components/`

```typescript
// src/features/board/components/BoardHeader.tsx
import { Button } from '@/components/ui/button';
import { useUpdateBoard } from '@/hooks/api/useUpdateBoard';
import type { Board, UpdateBoardDto } from '@/types';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const { mutate: updateBoard, loading } = useUpdateBoard(board.id);

  const handleUpdate = (data: UpdateBoardDto) => {
    updateBoard(data);
  };

  return (
    <header className="flex items-center justify-between p-4">
      <h1 className="text-2xl font-bold">{board.name}</h1>
      <Button onClick={() => handleUpdate({ name: 'Updated' })} disabled={loading}>
        Update
      </Button>
    </header>
  );
}
```

---

### 5. WebSocket Integration

**Location**: `src/services/websocket/WebSocketService.ts`

```typescript
// WebSocket service (singleton)
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
      auth: { token: getAuthToken() },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  joinBoard(boardId: string) {
    this.socket?.emit('board:join', { boardId });
  }

  leaveBoard(boardId: string) {
    this.socket?.emit('board:leave', { boardId });
  }

  on<T>(event: string, callback: (data: T) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: Function) {
    this.socket?.off(event, callback as any);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const webSocketService = new WebSocketService();
```

**Usage in Hook**:

```typescript
// src/hooks/websocket/useRealtimeBoardUpdates.ts
import { useEffect } from 'react';
import { webSocketService } from '@/services/websocket/WebSocketService';
import { useToast } from '@/hooks/common/useToast';

export function useRealtimeBoardUpdates(boardId: string) {
  const toast = useToast();

  useEffect(() => {
    // Connect and join board room
    webSocketService.connect();
    webSocketService.joinBoard(boardId);

    // Listen for updates
    const handleCardCreated = (data: any) => {
      console.log('Card created:', data);
      // Update local state...
    };

    webSocketService.on('card:created', handleCardCreated);

    // Connection status handlers
    webSocketService.on('reconnecting', () => {
      toast.info('Reconnecting...');
    });

    webSocketService.on('reconnect', () => {
      toast.success('Reconnected');
    });

    // Cleanup
    return () => {
      webSocketService.off('card:created', handleCardCreated);
      webSocketService.leaveBoard(boardId);
    };
  }, [boardId]);
}
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Add service method** (`src/services/api/[resource].service.ts`):

```typescript
export const cardService = {
  // ... existing methods

  assignUser: async (cardId: string, userId: string): Promise<Card> => {
    const response = await apiClient.post(`/cards/${cardId}/assign`, { userId });
    return response.data.data;
  },
};
```

2. **Create custom hook** (`src/hooks/api/useAssignUser.ts`):

```typescript
export function useAssignUser(cardId: string) {
  const { mutate, loading, error } = useApiMutation(
    (userId: string) => cardService.assignUser(cardId, userId),
    {
      successMessage: 'User assigned successfully',
    },
  );

  return { mutate, loading, error };
}
```

3. **Use in component**:

```typescript
const { mutate: assignUser, loading } = useAssignUser(card.id);

<Button onClick={() => assignUser('user-123')} disabled={loading}>
  Assign
</Button>
```

---

### Adding a New Feature Module

1. **Create feature directory**:

```bash
mkdir -p src/features/[feature-name]/{components,hooks,types}
```

2. **Add index.ts for public exports**:

```typescript
// src/features/[feature-name]/index.ts
export * from './components';
export * from './hooks';
export * from './types';
```

3. **Create feature components**:

```typescript
// src/features/[feature-name]/components/[Feature]Component.tsx
export function FeatureComponent() {
  // Feature-specific logic
}
```

4. **Add feature-specific hooks** (if needed):

```typescript
// src/features/[feature-name]/hooks/useFeatureLogic.ts
export function useFeatureLogic() {
  // Feature-specific hook logic
}
```

---

### Handling Errors

All errors flow through the multi-layer system:

1. **Axios interceptor**: Retries network errors, transforms to custom error types
2. **Custom hooks**: Expose error state, trigger toast notifications
3. **Components**: Display error state in UI

**In component**:

```typescript
const { data, loading, error } = useGetBoard(boardId);

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} onRetry={refetch} />;
return <BoardView board={data} />;
```

---

## Testing Guidelines

### Unit Test: Service Function

```typescript
// board.service.test.ts
import { boardService } from './board.service';
import { apiClient } from './client';

jest.mock('./client');

test('getBoard fetches board by ID', async () => {
  const mockBoard = { id: '123', name: 'Test Board' };
  (apiClient.get as jest.Mock).mockResolvedValue({
    data: { data: mockBoard },
  });

  const board = await boardService.getBoard('123');

  expect(board).toEqual(mockBoard);
  expect(apiClient.get).toHaveBeenCalledWith('/boards/123');
});
```

### Unit Test: Custom Hook

```typescript
// useGetBoard.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGetBoard } from './useGetBoard';
import { boardService } from '@/services/api/board.service';

jest.mock('@/services/api/board.service');

test('useGetBoard fetches board data', async () => {
  const mockBoard = { id: '123', name: 'Test Board' };
  (boardService.getBoard as jest.Mock).mockResolvedValue(mockBoard);

  const { result } = renderHook(() => useGetBoard('123'));

  // Initially loading
  expect(result.current.loading).toBe(true);

  // Wait for data
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  // Check result
  expect(result.current.data).toEqual(mockBoard);
});
```

### E2E Test: Board Operations

```typescript
// board.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a board', async ({ page }) => {
  await page.goto('/');

  // Click create board button
  await page.click('button:has-text("Create Board")');

  // Fill form
  await page.fill('input[name="name"]', 'Test Board');
  await page.click('button:has-text("Create")');

  // Verify board created
  await expect(page).toHaveURL(/\/board\/.+/);
  await expect(page.locator('h1')).toHaveText('Test Board');
});
```

---

## Debugging Tips

### Check API Requests

```typescript
// Enable axios request logging
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});
```

### Monitor WebSocket Events

```typescript
// Log all WebSocket events
webSocketService.socket?.onAny((event, ...args) => {
  console.log('[WebSocket Event]', event, args);
});
```

### React DevTools

- Install React DevTools browser extension
- Use Components tab to inspect hook state
- Use Profiler tab to measure re-renders

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/...' "

**Solution**: Check `tsconfig.json` has path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: CORS errors

**Solution**: Check backend CORS configuration allows frontend origin:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Issue: WebSocket not connecting

**Solution**:

1. Check `VITE_WEBSOCKET_URL` in `.env`
2. Verify backend WebSocket server is running
3. Check browser console for connection errors

### Issue: Toast notifications not appearing

**Solution**: Ensure `<Toaster />` component is in root:

```typescript
// App.tsx
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}
```

---

## Component Hierarchy & Data Flow (T095)

### Component Architecture

```
App.tsx (Router + ErrorBoundary + Suspense)
│
├── BoardViewPage (Route: /boards/:id)
│   │
│   ├── Board (features/board)
│   │   │
│   │   ├── List (features/list) [React.memo]
│   │   │   │
│   │   │   ├── Card (features/card) [React.memo, drag-and-drop]
│   │   │   │   └── AssigneeAvatars
│   │   │   │
│   │   │   └── CreateCardForm
│   │   │       └── Form components (shadcn/ui)
│   │   │
│   │   └── CreateListForm
│   │       └── Form components (shadcn/ui)
│   │
│   └── CardModal (features/card, opened on card click)
│       ├── CardDescription
│       ├── AssigneeSelector
│       ├── LabelSelector
│       ├── DueDatePicker
│       ├── AttachmentList
│       ├── CommentList (uses ConfirmDialog)
│       ├── ChecklistSection (uses ConfirmDialog)
│       └── ActivityFeed (virtual scrolling)
│
├── HomePage (Route: /)
│   └── BoardList
│       └── Board cards
│
└── Other pages (Login, Register, etc.)
```

### Data Flow Pattern

```
User Action → Component
    ↓
Custom Hook (e.g., useCreateCard)
    ↓
API Service (e.g., cardService.createCard)
    ↓
Axios Client (with interceptors)
    ↓
Backend API
    ↓
[Success Path]
    ↓
State Update (optimistic or on response)
    ↓
Component Re-render
    ↓
Toast Notification (success)

[Error Path]
    ↓
Error Transformation (ApiError, NetworkError, etc.)
    ↓
Error Handler (in hook)
    ↓
Toast Notification (error + retry button)
    ↓
State Rollback (if optimistic update)
```

### Real-Time Sync Flow

```
[User A] Card Update
    ↓
API Call → Backend
    ↓
WebSocket Event Broadcast
    ↓
[User B] WebSocketService receives event
    ↓
useRealtimeBoardUpdates hook processes event
    ↓
Event Deduplication (skip if from current user)
    ↓
Zustand Store Update
    ↓
Component Re-render (memoized, only if data changed)
```

### Performance Optimizations

- **React.memo**: Card and List components memoized to prevent unnecessary re-renders during drag-and-drop
- **Virtual Scrolling**: List component uses @tanstack/react-virtual for efficient rendering of many cards
- **ActivityFeed**: Infinite scroll with virtual scrolling for performance
- **Lazy Loading**: All page components lazy-loaded with React.lazy() and Suspense
- **Code Splitting**: Automatic route-based code splitting via Vite

### State Management Strategy

```
Zustand Stores (Global State)
└── useBoardStore
    ├── boards: Board[]
    ├── cards: Record<listId, Card[]>
    ├── isLoadingLists: boolean
    ├── isLoadingCards: Record<listId, boolean>
    └── actions (setBoardData, addCard, moveCard, etc.)

React Local State (Component-Specific)
└── useState for:
    ├── Form inputs (newCardTitle, comment text)
    ├── Modal open/close states
    ├── Confirm dialog states
    └── Loading indicators (isSubmitting)

Custom Hooks (Reusable Logic + API State)
└── useGetBoard, useCreateCard, etc.
    ├── data: T | null
    ├── loading: boolean
    ├── error: Error | null
    └── mutate/refetch functions
```

---

## Next Steps

1. **Read full plan**: [plan.md](./plan.md)
2. **Review contracts**: [contracts/](./contracts/)
3. **Check tasks**: `tasks.md` (generated by `/speckit.tasks`)
4. **Start coding**: Pick a task and follow the patterns above

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Hooks**: [contracts/api-hooks.md](./contracts/api-hooks.md)
- **WebSocket**: [contracts/websocket-events.md](./contracts/websocket-events.md)
- **Error Handling**: [contracts/error-handling.md](./contracts/error-handling.md)

## Questions?

Refer to the detailed documentation above or ask the team for clarification.
