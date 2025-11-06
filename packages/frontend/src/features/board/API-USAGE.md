# API Hooks Usage Guide

This document shows how to use the new API layer in components.

## Overview

The API layer follows a two-tier pattern:

1. **Service Layer**: Pure functions that make HTTP requests (`src/services/api/`)
2. **Hook Layer**: React hooks that manage state and side effects (`src/hooks/api/`)

## Query Hooks (Data Fetching)

### useGetBoards

Fetch all boards for the current user.

```typescript
import { useGetBoards } from '@/hooks/api';

function BoardsList() {
  const { data: boards, loading, error, refetch } = useGetBoards();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {boards?.map(board => (
        <div key={board.id}>{board.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useGetBoard

Fetch a single board by ID.

```typescript
import { useGetBoard } from '@/hooks/api';
import { useParams } from 'react-router-dom';

function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, loading, error, refetch } = useGetBoard(boardId);

  // ... render board
}
```

## Mutation Hooks (Data Modification)

### Board Mutations

#### useCreateBoard

```typescript
import { useCreateBoard } from '@/hooks/api';

function CreateBoardForm() {
  const { mutate: createBoard, loading } = useCreateBoard({
    onSuccess: (board) => {
      console.log('Board created:', board);
      // Navigate to board or refetch list
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBoard({
      name: 'My New Board',
      description: 'Board description',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>Create Board</button>
    </form>
  );
}
```

#### useUpdateBoard

```typescript
import { useUpdateBoard } from '@/hooks/api';

function BoardSettings({ boardId }: { boardId: string }) {
  const { mutate: updateBoard, loading } = useUpdateBoard(boardId, {
    onSuccess: () => {
      console.log('Board updated');
    },
  });

  const handleRename = (name: string) => {
    updateBoard({ name });
  };

  // ... render UI
}
```

#### useDeleteBoard

```typescript
import { useDeleteBoard } from '@/hooks/api';
import { useNavigate } from 'react-router-dom';

function BoardMenu({ boardId }: { boardId: string }) {
  const navigate = useNavigate();
  const { mutate: deleteBoard, loading } = useDeleteBoard({
    onSuccess: () => {
      navigate('/boards');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Delete this board?')) {
      deleteBoard();
    }
  };

  return <button onClick={handleDelete} disabled={loading}>Delete</button>;
}
```

### List Mutations

#### useCreateList

```typescript
import { useCreateList } from '@/hooks/api';

function CreateListButton({ boardId }: { boardId: string }) {
  const { mutate: createList, loading } = useCreateList({
    onSuccess: (list) => {
      console.log('List created:', list);
    },
  });

  const handleCreate = () => {
    createList({
      boardId,
      name: 'To Do',
      position: 0,
    });
  };

  return <button onClick={handleCreate} disabled={loading}>Add List</button>;
}
```

#### useReorderLists

```typescript
import { useReorderLists } from '@/hooks/api';

function BoardLists({ boardId, lists }: { boardId: string; lists: List[] }) {
  const { mutate: reorderLists } = useReorderLists({
    onSuccess: () => {
      console.log('Lists reordered');
    },
  });

  const handleDragEnd = (listIds: string[]) => {
    reorderLists({ boardId, listIds });
  };

  // ... render with drag-and-drop
}
```

### Card Mutations

#### useCreateCard

```typescript
import { useCreateCard } from '@/hooks/api';

function AddCardButton({ listId }: { listId: string }) {
  const { mutate: createCard, loading } = useCreateCard({
    onSuccess: (card) => {
      console.log('Card created:', card);
    },
  });

  const handleCreate = () => {
    createCard({
      listId,
      title: 'New Task',
      description: 'Task description',
      position: 0,
    });
  };

  return <button onClick={handleCreate} disabled={loading}>Add Card</button>;
}
```

#### useUpdateCard

```typescript
import { useUpdateCard } from '@/hooks/api';

function CardEditor({ cardId }: { cardId: string }) {
  const { mutate: updateCard, loading } = useUpdateCard(cardId, {
    onSuccess: (card) => {
      console.log('Card updated:', card);
    },
  });

  const handleUpdate = (title: string, description: string) => {
    updateCard({ title, description });
  };

  // ... render edit form
}
```

#### useMoveCard

```typescript
import { useMoveCard } from '@/hooks/api';

function CardItem({ card, listId }: { card: Card; listId: string }) {
  const { mutate: moveCard } = useMoveCard({
    onSuccess: () => {
      console.log('Card moved');
    },
  });

  const handleDrop = (targetListId: string, position: number) => {
    moveCard({
      cardId: card.id,
      sourceListId: listId,
      targetListId,
      position,
    });
  };

  // ... render with drag-and-drop
}
```

## Real-time Updates

### useRealtimeBoardUpdates

Subscribe to WebSocket events for real-time synchronization.

```typescript
import { useRealtimeBoardUpdates } from '@/hooks/websocket';
import { useGetBoard } from '@/hooks/api';

function BoardView({ boardId }: { boardId: string }) {
  const { data: board, refetch } = useGetBoard(boardId);
  const currentUserId = 'user-id'; // Get from auth context

  useRealtimeBoardUpdates({
    boardId,
    currentUserId,

    // Board events
    onBoardUpdated: () => {
      refetch(); // Sync with server
    },
    onMemberJoined: (event) => {
      console.log('Member joined:', event.user.username);
    },

    // List events
    onListCreated: (event) => {
      console.log('List created:', event.list.name);
      refetch();
    },
    onListsReordered: () => {
      refetch();
    },

    // Card events
    onCardCreated: (event) => {
      console.log('Card created:', event.card.title);
      refetch();
    },
    onCardMoved: () => {
      refetch();
    },

    // Reconnection
    onReconnect: () => {
      refetch(); // Sync after reconnecting
    },
  });

  // ... render board
}
```

## Error Handling

All mutation hooks include automatic error handling with toast notifications:

- **Success toasts**: Shown for create/delete operations
- **Error toasts**: Shown with retry button on failure
- **Silent operations**: Update and move operations don't show success toasts

To customize error handling:

```typescript
const { mutate: createBoard } = useCreateBoard({
  onError: (error, variables) => {
    // Custom error handling
    console.error('Failed to create board:', error);

    // Send to error tracking service
    Sentry.captureException(error);
  },
  onSuccess: (board, variables) => {
    // Custom success handling
    analytics.track('Board Created', { boardId: board.id });
  },
});
```

## Loading States

All hooks provide loading states for UI feedback:

```typescript
function MyComponent() {
  const { mutate: createBoard, loading } = useCreateBoard();

  return (
    <button onClick={() => createBoard({ name: 'New' })} disabled={loading}>
      {loading ? 'Creating...' : 'Create Board'}
    </button>
  );
}
```

## TypeScript Types

All hooks are fully typed. Import types from `@/types/`:

```typescript
import type { Board, CreateBoardDto, UpdateBoardDto } from '@/types/board.types';
import type { List, CreateListDto, UpdateListDto } from '@/types/list.types';
import type { Card, CreateCardDto, UpdateCardDto, MoveCardDto } from '@/types/card.types';
import type { ApiResponse, UseQueryResult, UseMutationResult } from '@/types/api.types';
```

## Best Practices

1. **Use callbacks for side effects**: onSuccess, onError, onSettled
2. **Refetch after real-time events**: Keep data consistent with server
3. **Handle loading states**: Disable buttons during mutations
4. **Type everything**: Use provided TypeScript types
5. **Error boundaries**: Wrap components in ErrorBoundary for crash protection
