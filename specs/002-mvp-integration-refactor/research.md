# Research: MVP Integration Bug Fixes & Frontend Refactoring

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Phase**: 0 - Outline & Research

## Research Questions

### 1. Custom Hooks Pattern for API Operations

**Question**: What is the best practice for implementing custom hooks that wrap API service calls in React applications?

**Decision**: Implement a two-layer pattern:

1. **Service Layer**: Pure TypeScript functions that handle HTTP requests (axios-based)
2. **Hook Layer**: React hooks that wrap service functions and manage React-specific concerns (loading, error, data state)

**Rationale**:

- **Separation of concerns**: Business logic (API calls) separate from React state management
- **Reusability**: Services can be called outside of React components (e.g., in middleware, utilities)
- **Testability**: Services are easier to test in isolation; hooks can be tested with React Testing Library
- **Type safety**: Full TypeScript support for request/response types
- **Consistency**: All API operations follow the same pattern

**Pattern Structure**:

```typescript
// Service layer (pure functions)
export const boardService = {
  getBoard: async (id: string): Promise<Board> => { ... },
  createBoard: async (data: CreateBoardDto): Promise<Board> => { ... }
}

// Hook layer (React state management)
export const useGetBoard = (id: string) => {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // ... implementation
  return { data, loading, error, refetch };
}

export const useCreateBoard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // ... implementation
  return { mutate, loading, error };
}
```

**Alternatives Considered**:

- **React Query/TanStack Query**: Excellent library with caching, automatic retries, and devtools. Rejected because:
  - Adds another dependency and learning curve
  - Current project doesn't need advanced caching features (real-time updates via WebSocket)
  - Custom hooks pattern gives more control for this specific use case
  - Constitution emphasizes simplicity and avoiding over-engineering
- **Direct axios calls in components**: Rejected because:
  - Violates DRY principle (duplicate error handling, loading states)
  - Makes testing harder
  - No centralized configuration

- **Redux Toolkit Query**: Rejected because:
  - Would require full Redux adoption
  - Overkill for current needs
  - Team is using Zustand for state management

**References**:

- React Hooks best practices: https://react.dev/learn/reusing-logic-with-custom-hooks
- Kent C. Dodds - Application State Management with React: https://kentcdodds.com/blog/application-state-management-with-react

---

### 2. WebSocket Connection Management with Automatic Reconnection

**Question**: How should WebSocket connections be managed in React with automatic reconnection and proper cleanup?

**Decision**: Implement a centralized WebSocket service with custom hook wrapper:

1. **WebSocketService class**: Singleton pattern managing Socket.io connection lifecycle
2. **useWebSocket hook**: React hook providing connection status and event subscription
3. **Event-specific hooks**: Domain-specific hooks like `useRealtimeBoardUpdates(boardId)`

**Rationale**:

- **Centralized connection**: Single Socket.io instance shared across application
- **Automatic reconnection**: Socket.io built-in reconnection with exponential backoff
- **Memory leak prevention**: Proper cleanup on component unmount
- **Type safety**: TypeScript interfaces for all event payloads
- **User feedback**: Connection status exposed to show toast notifications

**Implementation Pattern**:

```typescript
// WebSocket service (singleton)
class WebSocketService {
  private socket: Socket | null = null;

  connect(): void { ... }
  disconnect(): void { ... }
  on<T>(event: string, callback: (data: T) => void): void { ... }
  off(event: string, callback?: Function): void { ... }
  emit<T>(event: string, data: T): void { ... }
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' { ... }
}

// Base hook
export const useWebSocket = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    webSocketService.connect();
    // ... setup listeners for connection events
    return () => webSocketService.disconnect();
  }, []);

  return { status, socket: webSocketService };
}

// Domain-specific hook
export const useRealtimeBoardUpdates = (boardId: string) => {
  const { socket, status } = useWebSocket();
  const [updates, setUpdates] = useState<BoardUpdate[]>([]);

  useEffect(() => {
    if (status !== 'connected') return;

    const handler = (data: BoardUpdate) => setUpdates(prev => [...prev, data]);
    socket.on(`board:${boardId}:update`, handler);

    return () => socket.off(`board:${boardId}:update`, handler);
  }, [boardId, status]);

  return { updates, connectionStatus: status };
}
```

**Alternatives Considered**:

- **Multiple Socket.io instances per component**: Rejected because:
  - Wastes resources (multiple connections)
  - Harder to manage connection state
  - Can cause race conditions
- **Raw WebSocket API**: Rejected because:
  - Socket.io provides automatic reconnection
  - Socket.io handles fallbacks (long polling if WebSocket unavailable)
  - Socket.io has better browser compatibility
- **Context API for WebSocket**: Rejected because:
  - Context causes unnecessary re-renders for all consumers
  - Hooks + service pattern provides better control

**References**:

- Socket.io client API: https://socket.io/docs/v4/client-api/
- React + Socket.io patterns: https://socket.io/how-to/use-with-react

---

### 3. Feature-Based Folder Structure Best Practices

**Question**: What is the recommended folder structure for feature-based organization in React applications?

**Decision**: Implement feature-based structure with clear separation:

```
src/
├── features/           # Feature-specific code
│   ├── board/
│   │   ├── components/ # Board-specific components
│   │   ├── hooks/      # Board-specific hooks
│   │   ├── types/      # Board-specific types
│   │   └── index.ts    # Public exports
│   ├── card/
│   └── list/
├── components/ui/      # Shared UI components only
├── services/           # Infrastructure services
├── hooks/              # Shared/common hooks
├── pages/              # Route-level components
└── layouts/            # Layout wrappers
```

**Rationale**:

- **Colocation**: Related files stay together (easier to find and modify)
- **Encapsulation**: Features can export only what's needed via index.ts
- **Scalability**: Easy to add new features without affecting existing ones
- **Team workflow**: Multiple developers can work on different features independently
- **Code splitting**: Natural boundaries for lazy loading

**Feature Structure Guidelines**:

- Each feature has its own `components/`, `hooks/`, `types/` subdirectories
- Features export public API through `index.ts` (barrel exports)
- Cross-feature imports should go through public exports only
- Shared code goes in top-level directories (`components/ui/`, `hooks/`, `services/`)

**Alternatives Considered**:

- **Type-based structure (all components together)**: Rejected because:
  - Doesn't scale well (hundreds of files in one directory)
  - Hard to find related files
  - Encourages tight coupling
- **Atomic Design (atoms/molecules/organisms)**: Rejected because:
  - Academic classification doesn't match business domains
  - Unclear where domain logic goes
  - Team feedback: too abstract
- **Flat structure with prefixes**: Rejected because:
  - Still results in large directories
  - Prefixes don't provide real organization

**References**:

- Bulletproof React: https://github.com/alan2207/bulletproof-react
- React folder structure best practices: https://react.dev/learn/thinking-in-react#step-2-build-a-static-version-in-react

---

### 4. Error Handling Patterns with Toast Notifications

**Question**: How should API errors be handled consistently with toast notifications and retry capability?

**Decision**: Implement three-layer error handling:

1. **HTTP Interceptor**: Catches all axios errors, provides retry logic with exponential backoff
2. **Custom Hook Error State**: Hooks expose error state to components
3. **Toast Provider**: Centralized toast notification service for user-facing errors

**Rationale**:

- **User experience**: Non-blocking feedback, user can continue working
- **Retry capability**: Transient errors auto-retry; persistent errors show manual retry button
- **Consistency**: All errors follow same pattern
- **Flexibility**: Components can override default behavior if needed

**Implementation Pattern**:

```typescript
// Axios interceptor with retry
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;

    // Retry logic (up to 3 attempts for network errors)
    if (isNetworkError(error) && config._retryCount < 3) {
      config._retryCount = (config._retryCount || 0) + 1;
      await delay(Math.pow(2, config._retryCount) * 1000); // Exponential backoff
      return axiosInstance(config);
    }

    throw error;
  }
);

// Custom hook error handling
export const useCreateCard = () => {
  const toast = useToast();

  const mutate = async (data: CreateCardDto) => {
    setLoading(true);
    setError(null);

    try {
      const result = await cardService.createCard(data);
      setData(result);
      toast.success('Card created successfully');
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);

      // Show toast with retry
      toast.error({
        message: 'Failed to create card',
        action: {
          label: 'Retry',
          onClick: () => mutate(data)
        }
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// Toast service (using shadcn/ui Toast component)
export const useToast = () => {
  const { toast } = useToastPrimitive(); // shadcn/ui hook

  return {
    success: (message: string) => toast({ title: message, variant: 'default' }),
    error: (options: ToastErrorOptions) => toast({
      title: options.message,
      variant: 'destructive',
      action: options.action ? (
        <Button onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined
    }),
    info: (message: string) => toast({ title: message, variant: 'default' })
  };
}
```

**Error Categories**:

- **Network errors** (timeout, connection failed): Auto-retry up to 3 times with exponential backoff
- **4xx Client errors** (validation, auth): Show error message, no auto-retry
- **5xx Server errors**: Auto-retry once, then show error with manual retry button

**Alternatives Considered**:

- **Modal dialogs for errors**: Rejected because:
  - Blocks user workflow
  - Annoying for transient errors
  - Not modern UX pattern
- **Inline error messages only**: Rejected because:
  - User might not see errors (if not looking at that component)
  - No way to show global errors (like WebSocket disconnection)
- **Silent errors with console logs**: Rejected because:
  - Poor UX (user doesn't know what happened)
  - Violates constitution's UX consistency principle

**References**:

- Axios interceptors: https://axios-http.com/docs/interceptors
- shadcn/ui Toast: https://ui.shadcn.com/docs/components/toast
- Error handling best practices: https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript

---

### 5. Component Organization and Extraction Patterns

**Question**: How should components be organized and when should logic be extracted into reusable components?

**Decision**: Follow the "Rule of Three" with clear extraction criteria:

1. **Extract to `components/ui/`** when: Used in 3+ places OR highly likely to be reused
2. **Keep in feature folder** when: Feature-specific, unlikely to be reused elsewhere
3. **Document all components** with TypeScript interfaces and JSDoc comments

**Extraction Checklist**:

- [ ] Component is used in 3+ different features
- [ ] Component is purely presentational (no business logic)
- [ ] Component has clear, minimal props interface
- [ ] Component behavior is consistent across use cases

**Component Categories**:

**1. Shared UI Components** (`components/ui/`):

- Button, Input, Dialog, Toast, Dropdown, etc. (shadcn/ui)
- Custom wrappers if needed (e.g., ConfirmDialog, FormInput)
- NO business logic, only presentation

**2. Feature Components** (`features/*/components/`):

- BoardHeader, CardItem, ListContainer, etc.
- Contains feature-specific logic
- Can use shared UI components
- Can have local sub-components (not exported)

**3. Page Components** (`pages/`):

- Top-level route components
- Compose feature components
- Handle routing logic, guards
- Minimal business logic (delegate to hooks)

**4. Layout Components** (`layouts/`):

- MainLayout, AuthLayout, etc.
- Handle app-wide structure (header, sidebar, footer)
- No feature-specific logic

**Composition Over Configuration**:

- Prefer composition (children, render props) over complex props
- Avoid "kitchen sink" components with 20+ props
- Split large components into smaller, focused ones

**Alternatives Considered**:

- **Extract everything immediately**: Rejected because:
  - Premature abstraction
  - Harder to change when requirements evolve
- **Never extract until forced**: Rejected because:
  - Leads to massive code duplication
  - Harder to maintain consistency

**References**:

- Rule of Three: https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)
- Component design: https://react.dev/learn/thinking-in-react
- Composition patterns: https://reactpatterns.com/

---

### 6. Routing Configuration and Lazy Loading Strategy

**Question**: How should routes be organized with lazy loading for optimal performance?

**Decision**: Centralized route configuration with lazy loading for all page-level components:

```typescript
// App.tsx or routes.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner />
  </div>
);

export const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="board/:id" element={<BoardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
```

**Rationale**:

- **Code splitting**: Each page is a separate bundle, loaded on demand
- **Faster initial load**: Only load code for current page
- **Clear structure**: All routes visible in one place
- **Easy to add guards**: Wrapper components for auth, permissions

**Lazy Loading Rules**:

- **DO lazy load**: Pages, large feature modules, rarely-used components
- **DON'T lazy load**: Shared UI components, small components, frequently-used features

**Route Guards** (if needed):

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Usage
<Route path="board/:id" element={
  <ProtectedRoute>
    <BoardPage />
  </ProtectedRoute>
} />
```

**Alternatives Considered**:

- **No lazy loading**: Rejected because:
  - Large initial bundle size
  - Slower time to interactive
- **Lazy load everything**: Rejected because:
  - Too many small bundles
  - More HTTP requests
  - Worse user experience (constant loading)

**References**:

- React Router v6: https://reactrouter.com/en/main
- Code splitting: https://react.dev/reference/react/lazy

---

### 7. TypeScript Strict Mode and Type Safety Patterns

**Question**: How to maintain TypeScript strict mode compliance while refactoring?

**Decision**: Enforce strict mode with zero tolerance for `any` types (except explicitly justified):

**Type Safety Patterns**:

1. **API Types**: Define interfaces for all request/response shapes

```typescript
// services/types/board.types.ts
export interface Board {
  id: string;
  name: string;
  lists: List[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardDto {
  name: string;
  description?: string;
}

export type UpdateBoardDto = Partial<CreateBoardDto>;
```

2. **Hook Return Types**: Explicitly type all hook returns

```typescript
interface UseCreateBoardReturn {
  mutate: (data: CreateBoardDto) => Promise<Board>;
  data: Board | null;
  loading: boolean;
  error: Error | null;
}

export const useCreateBoard = (): UseCreateBoardReturn => {
  // ...
};
```

3. **Event Handler Types**: Use React's built-in types

```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

4. **Generic Hooks**: Type generic utilities properly

```typescript
function useAsync<T>(asyncFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // ...
  return { data, loading, error };
}
```

**Allowed `any` Uses** (must be documented):

- Third-party library types that are genuinely untyped
- Temporary during refactor (with `// TODO: type this` comment)
- Event handlers where type is overly complex and not worth the effort

**ESLint Rules**:

```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-member-access": "error"
}
```

**Alternatives Considered**:

- **Relaxed mode**: Rejected because violates constitution
- **Gradual typing**: Rejected because creates inconsistency

**References**:

- TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app/

---

## Summary

All research questions have been resolved with clear decisions, rationale, and alternatives considered. The technical approach is:

1. **Two-layer API pattern**: Service functions + Custom hooks
2. **Centralized WebSocket**: Singleton service + React hooks
3. **Feature-based structure**: Domain-driven organization with shared UI
4. **Three-layer error handling**: Interceptor + Hook state + Toast notifications
5. **Rule of Three extraction**: Extract when reused 3+ times
6. **Lazy-loaded routing**: Route-based code splitting
7. **Strict TypeScript**: Zero `any` types (except documented exceptions)

All decisions align with the constitution principles (code quality, maintainability, UX consistency, performance). Ready to proceed to Phase 1: Design & Contracts.
