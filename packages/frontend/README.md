# Trello-Vibe Frontend

Modern, feature-based React application for the Trello-Vibe project management platform.

## Tech Stack

- **React**: 19.1.1 with hooks and concurrent features
- **TypeScript**: 5.9.3 with strict mode
- **Vite**: 7.1.7 for fast development and optimized builds
- **React Router**: 7.9.5 for client-side routing
- **Zustand**: 5.0.8 for global state management
- **Tailwind CSS**: 4.1.16 for utility-first styling
- **shadcn/ui**: Accessible component library built on Radix UI
- **Socket.io Client**: 4.8.1 for real-time updates
- **Axios**: 1.13.1 for HTTP requests
- **Vitest**: 4.0.6 for unit testing
- **Playwright**: 1.56.1 for E2E testing

## Architecture Overview

### Feature-Based Structure

The codebase follows a feature-based architecture that co-locates related components, hooks, and types:

```
src/
├── features/              # Feature modules
│   ├── board/             # Board management
│   │   ├── components/    # Board-specific components
│   │   ├── types/         # Board-specific types
│   │   └── index.ts       # Public exports
│   ├── card/              # Card management
│   │   ├── components/    # Card-specific components (Card, CardModal, etc.)
│   │   ├── types/         # Card-specific types
│   │   └── index.ts
│   └── list/              # List management
│       ├── components/    # List-specific components
│       ├── types/         # List-specific types
│       └── index.ts
│
├── services/              # Infrastructure services
│   ├── api/               # API layer
│   │   ├── client.ts      # Configured axios instance
│   │   ├── board.service.ts
│   │   ├── card.service.ts
│   │   └── list.service.ts
│   └── websocket/         # Real-time communication
│       └── WebSocketService.ts
│
├── hooks/                 # Custom React hooks
│   ├── api/               # API operation hooks
│   │   ├── useGetBoard.ts
│   │   ├── useCreateCard.ts
│   │   ├── useMoveCard.ts
│   │   └── ...
│   ├── websocket/         # WebSocket hooks
│   │   └── useWebSocket.ts
│   └── common/            # Shared hooks
│       ├── useToast.ts
│       └── useErrorHandler.ts
│
├── components/            # Shared components
│   └── ui/                # shadcn/ui components
│
├── pages/                 # Route page components
│   ├── HomePage.tsx
│   ├── BoardViewPage.tsx
│   └── NotFoundPage.tsx
│
├── types/                 # Shared TypeScript types
│   ├── board.types.ts
│   ├── card.types.ts
│   ├── list.types.ts
│   ├── api.types.ts
│   ├── error.types.ts
│   └── websocket.types.ts
│
├── lib/                   # Utility functions
│   └── errors.ts          # Error handling utilities
│
├── stores/                # Zustand stores
│   └── useBoardStore.ts
│
├── App.tsx                # Root component with routing
└── main.tsx               # Application entry point
```

### Key Architectural Patterns

#### 1. Service Layer Pattern

Pure TypeScript functions for API interactions, separate from React components:

```typescript
// src/services/api/board.service.ts
export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    /* ... */
  },
  getBoard: async (id: string): Promise<Board> => {
    /* ... */
  },
  createBoard: async (data: CreateBoardDto): Promise<Board> => {
    /* ... */
  },
  // ...
};
```

**Benefits**:

- Easy to test (mock services, not axios)
- Reusable across components
- Consistent error handling
- Single source of truth for endpoints

#### 2. Custom Hooks Pattern

React hooks wrapping service functions, providing state management:

```typescript
// src/hooks/api/useGetBoard.ts
export function useGetBoard(boardId: string) {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch logic, error handling, loading states

  return { data, loading, error, refetch };
}
```

**Benefits**:

- Encapsulates data fetching logic
- Provides loading and error states
- Reusable across components
- Consistent API across all hooks

#### 3. Feature Modules

Related components, hooks, and types grouped by feature:

```typescript
// src/features/board/index.ts
export { Board } from './components/Board';
export { BoardHeader } from './components/BoardHeader';
export type { BoardProps } from './types/props';
```

**Benefits**:

- Clear code organization
- Easy to locate related files
- Supports independent feature development
- Facilitates code splitting

#### 4. WebSocket Singleton

Centralized WebSocket management:

```typescript
// src/services/websocket/WebSocketService.ts
class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    /* ... */
  }
  joinBoard(boardId: string) {
    /* ... */
  }
  on<T>(event: string, callback: (data: T) => void) {
    /* ... */
  }
  // ...
}

export const webSocketService = new WebSocketService();
```

**Benefits**:

- Single connection per app
- Centralized event management
- Easy reconnection handling
- Accessible from anywhere

## Getting Started

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x or higher
- Backend server running on http://localhost:3000

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev  # Runs on http://localhost:5173
```

### Development Commands

```bash
# Development
pnpm dev          # Start dev server with HMR
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors automatically
pnpm type-check   # Run TypeScript compiler check

# Testing
pnpm test         # Run unit tests with Vitest
pnpm test:ui      # Run tests with UI
pnpm test:coverage # Run tests with coverage report
pnpm test:e2e     # Run E2E tests with Playwright
```

## Development Guidelines

### Adding a New Feature

1. **Create feature directory**:

```bash
mkdir -p src/features/[feature-name]/{components,types}
touch src/features/[feature-name]/index.ts
```

2. **Add feature components**:

```typescript
// src/features/[feature-name]/components/FeatureComponent.tsx
export function FeatureComponent() {
  // Component logic
}
```

3. **Export from barrel**:

```typescript
// src/features/[feature-name]/index.ts
export { FeatureComponent } from './components/FeatureComponent';
```

4. **Use in pages or other features**:

```typescript
import { FeatureComponent } from '@/features/[feature-name]';
```

### Adding a New API Endpoint

1. **Add service method**:

```typescript
// src/services/api/[resource].service.ts
export const resourceService = {
  // ... existing methods

  newOperation: async (data: InputDto): Promise<OutputType> => {
    const response = await apiClient.post('/endpoint', data);
    return response.data.data;
  },
};
```

2. **Create custom hook**:

```typescript
// src/hooks/api/useNewOperation.ts
export function useNewOperation() {
  const [data, setData] = useState<OutputType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const mutate = async (input: InputDto): Promise<OutputType> => {
    setLoading(true);
    try {
      const result = await resourceService.newOperation(input);
      setData(result);
      toast.success('Operation successful');
      return result;
    } catch (err) {
      setError(err as Error);
      toast.error('Operation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, data, loading, error };
}
```

3. **Use in component**:

```typescript
const { mutate, loading } = useNewOperation();

<Button onClick={() => mutate(data)} disabled={loading}>
  Submit
</Button>
```

### Error Handling

All API errors flow through a multi-layer system:

1. **Axios Interceptor**: Retries network errors, transforms to custom error types
2. **Custom Hooks**: Expose error state, trigger toast notifications
3. **Components**: Display error UI with retry actions

```typescript
const { data, loading, error, refetch } = useGetBoard(boardId);

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} onRetry={refetch} />;
return <BoardView board={data} />;
```

### Real-Time Updates

WebSocket integration for live collaboration:

```typescript
// In component
import { webSocketService } from '@/services/websocket/WebSocketService';

useEffect(() => {
  webSocketService.connect();
  webSocketService.joinBoard(boardId);

  const handleCardCreated = (data: CardCreatedEvent) => {
    // Update local state
  };

  webSocketService.on('card:created', handleCardCreated);

  return () => {
    webSocketService.off('card:created', handleCardCreated);
    webSocketService.leaveBoard(boardId);
  };
}, [boardId]);
```

### Performance Optimizations

- **React.memo**: Used on expensive components (Card, List) to prevent unnecessary re-renders
- **Virtual Scrolling**: List component uses virtual scrolling for large datasets
- **Code Splitting**: Route-based code splitting via React.lazy() and Suspense
- **Lazy Loading**: All page components are lazy-loaded
- **Optimistic Updates**: UI updates immediately, with rollback on errors

## Testing

### Unit Tests

Located in `test/unit/`, organized by type:

```bash
test/unit/
├── hooks/           # Custom hook tests
├── services/        # Service function tests
└── lib/             # Utility function tests
```

Run unit tests:

```bash
pnpm test
```

### Integration Tests

Located in `test/integration/`, test component interactions:

```bash
test/integration/
├── board/           # Board feature tests
├── card/            # Card feature tests
└── notification/    # Toast notification tests
```

### E2E Tests

Located in `test/e2e/`, test full user flows:

```bash
test/e2e/
├── auth.spec.ts
├── board.spec.ts
├── cards.spec.ts
└── collaboration.spec.ts
```

Run E2E tests:

```bash
pnpm test:e2e
```

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
```

## Deployment

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Output is in dist/ directory
# Deploy dist/ to your hosting provider (Vercel, Netlify, etc.)
```

## Code Quality

### ESLint Configuration

Strict ESLint rules enforced:

- TypeScript recommended rules
- React hooks rules
- Import sorting
- Unused variable detection

### TypeScript Configuration

- Strict mode enabled
- Path aliases configured (`@/` → `src/`)
- No implicit any
- Strict null checks

### Pre-commit Hooks

Husky + lint-staged automatically:

- Runs ESLint on staged files
- Runs Prettier on staged files
- Blocks commit if errors found

## Troubleshooting

### Common Issues

**"Cannot find module '@/...'"**

- Check `tsconfig.json` has correct path mapping
- Restart TypeScript server in VS Code: Cmd+Shift+P → "Restart TS Server"

**CORS errors**

- Verify backend CORS configuration allows `http://localhost:5173`
- Check `VITE_API_BASE_URL` environment variable

**WebSocket not connecting**

- Verify `VITE_WEBSOCKET_URL` is correct
- Check backend WebSocket server is running
- Check browser console for connection errors

**Toast notifications not appearing**

- Ensure `<Toaster />` component is in `App.tsx`
- Check browser console for errors

## Documentation

For more details, see:

- [spec.md](../../specs/002-mvp-integration-refactor/spec.md) - Feature specification
- [plan.md](../../specs/002-mvp-integration-refactor/plan.md) - Implementation plan
- [quickstart.md](../../specs/002-mvp-integration-refactor/quickstart.md) - Developer quickstart
- [contracts/](../../specs/002-mvp-integration-refactor/contracts/) - API contracts

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and coding standards.

## License

[Add license information]
