# API Hooks Contract

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Purpose**: Define the public API for all custom hooks used for API operations

## Overview

This document specifies the contract (interface) for all custom hooks that wrap API service calls. These hooks provide a consistent pattern for managing API state (loading, error, data) and user feedback (toast notifications).

---

## Hook Patterns

### Query Hooks (GET operations)

Used for fetching data from the API.

**Pattern**:

```typescript
const useGetResource = (id?: string, options?: QueryOptions) => {
  return {
    data: Resource | null,
    loading: boolean,
    error: Error | null,
    refetch: () => Promise<void>,
  };
};
```

**Options**:

```typescript
interface QueryOptions {
  enabled?: boolean; // If false, don't auto-fetch on mount
  refetchInterval?: number; // Auto-refetch every N ms (optional)
  onSuccess?: (data: Resource) => void;
  onError?: (error: Error) => void;
}
```

---

### Mutation Hooks (POST, PATCH, DELETE operations)

Used for creating, updating, or deleting data.

**Pattern**:

```typescript
const useMutateResource = (options?: MutationOptions) => {
  return {
    mutate: (variables: MutationInput) => Promise<Resource>,
    mutateAsync: (variables: MutationInput) => Promise<Resource>,
    data: Resource | null,
    loading: boolean,
    error: Error | null,
    reset: () => void
  };
}
```

**Options**:

```typescript
interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
}
```

---

## Board Hooks

### useGetBoards

Fetch all boards for the current user.

**Signature**:

```typescript
function useGetBoards(options?: QueryOptions): UseQueryResult<Board[]>;
```

**Example**:

```typescript
const { data: boards, loading, error, refetch } = useGetBoards();

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <BoardList boards={boards} />;
```

**Behavior**:

- Auto-fetches on component mount
- Caches result (no re-fetch on re-render)
- Provides `refetch()` for manual refresh
- Shows error toast on failure

---

### useGetBoard

Fetch a single board by ID with all its lists and cards.

**Signature**:

```typescript
function useGetBoard(boardId: string, options?: QueryOptions): UseQueryResult<Board>;
```

**Example**:

```typescript
const { data: board, loading, error } = useGetBoard(boardId);
```

**Behavior**:

- Auto-fetches on mount if `boardId` is provided
- Updates when `boardId` changes
- Returns null if `boardId` is empty/undefined
- Shows error toast on failure

---

### useCreateBoard

Create a new board.

**Signature**:

```typescript
function useCreateBoard(
  options?: MutationOptions<Board, CreateBoardDto>,
): UseMutationResult<Board, CreateBoardDto>;
```

**Example**:

```typescript
const { mutate: createBoard, loading } = useCreateBoard({
  onSuccess: (board) => {
    navigate(`/board/${board.id}`);
  },
});

const handleSubmit = (data: CreateBoardDto) => {
  createBoard(data);
};
```

**Behavior**:

- Doesn't auto-execute (manual trigger via `mutate()`)
- Shows success toast: "Board created successfully"
- Shows error toast with retry button on failure
- Navigates to new board on success (if `onSuccess` provided)

---

### useUpdateBoard

Update an existing board.

**Signature**:

```typescript
function useUpdateBoard(
  boardId: string,
  options?: MutationOptions<Board, UpdateBoardDto>,
): UseMutationResult<Board, UpdateBoardDto>;
```

**Example**:

```typescript
const { mutate: updateBoard, loading } = useUpdateBoard(boardId, {
  onSuccess: () => {
    toast.success('Board updated');
  },
});
```

**Behavior**:

- Optimistic update (updates local state immediately)
- Rolls back on error
- Shows error toast with retry button on failure
- Broadcasts update via WebSocket (backend handles this)

---

### useDeleteBoard

Delete a board.

**Signature**:

```typescript
function useDeleteBoard(
  boardId: string,
  options?: MutationOptions<void, void>,
): UseMutationResult<void, void>;
```

**Example**:

```typescript
const { mutate: deleteBoard, loading } = useDeleteBoard(boardId, {
  onSuccess: () => {
    navigate('/');
  },
});
```

**Behavior**:

- Shows confirmation dialog before executing (via component logic)
- Shows success toast: "Board deleted"
- Shows error toast with retry button on failure
- Redirects to home on success

---

## List Hooks

### useGetLists

Fetch all lists for a board.

**Signature**:

```typescript
function useGetLists(boardId: string, options?: QueryOptions): UseQueryResult<List[]>;
```

**Note**: Usually not needed as `useGetBoard` includes lists.

---

### useCreateList

Create a new list on a board.

**Signature**:

```typescript
function useCreateList(
  boardId: string,
  options?: MutationOptions<List, CreateListDto>,
): UseMutationResult<List, CreateListDto>;
```

**Example**:

```typescript
const { mutate: createList, loading } = useCreateList(boardId);

const handleCreate = () => {
  createList({
    boardId,
    name: 'New List',
    position: lists.length,
  });
};
```

**Behavior**:

- Optimistic update (adds list to UI immediately)
- Auto-calculates position if not provided
- Shows success toast: "List created"
- Shows error toast with retry button on failure

---

### useUpdateList

Update a list (rename, reorder).

**Signature**:

```typescript
function useUpdateList(
  listId: string,
  options?: MutationOptions<List, UpdateListDto>,
): UseMutationResult<List, UpdateListDto>;
```

**Behavior**:

- Optimistic update
- Rolls back on error
- Shows error toast with retry button on failure

---

### useDeleteList

Delete a list and all its cards.

**Signature**:

```typescript
function useDeleteList(
  listId: string,
  options?: MutationOptions<void, void>,
): UseMutationResult<void, void>;
```

**Behavior**:

- Shows confirmation dialog before executing
- Optimistic update (removes from UI immediately)
- Rolls back on error
- Shows error toast with retry button on failure

---

### useReorderLists

Reorder lists horizontally on a board.

**Signature**:

```typescript
function useReorderLists(
  boardId: string,
  options?: MutationOptions<void, ReorderListsDto>,
): UseMutationResult<void, ReorderListsDto>;
```

**Example**:

```typescript
const { mutate: reorderLists } = useReorderLists(boardId);

const handleDragEnd = (result: DropResult) => {
  const newOrder = reorder(lists, result.source.index, result.destination.index);
  reorderLists({ boardId, listIds: newOrder.map((l) => l.id) });
};
```

**Behavior**:

- Optimistic update (reorders UI immediately)
- Rolls back on error
- Silent operation (no success toast)
- Shows error toast with retry button on failure

---

## Card Hooks

### useGetCard

Fetch a single card with full details.

**Signature**:

```typescript
function useGetCard(cardId: string, options?: QueryOptions): UseQueryResult<Card>;
```

**Note**: Usually not needed as `useGetBoard` includes all cards.

---

### useCreateCard

Create a new card in a list.

**Signature**:

```typescript
function useCreateCard(
  listId: string,
  options?: MutationOptions<Card, CreateCardDto>,
): UseMutationResult<Card, CreateCardDto>;
```

**Example**:

```typescript
const { mutate: createCard, loading } = useCreateCard(listId);

const handleSubmit = (data: CreateCardDto) => {
  createCard(data);
};
```

**Behavior**:

- Optimistic update (adds card to UI immediately)
- Auto-calculates position if not provided
- Shows success toast: "Card created"
- Shows error toast with retry button on failure

---

### useUpdateCard

Update a card (title, description, labels, assignees, etc.).

**Signature**:

```typescript
function useUpdateCard(
  cardId: string,
  options?: MutationOptions<Card, UpdateCardDto>,
): UseMutationResult<Card, UpdateCardDto>;
```

**Behavior**:

- Optimistic update
- Rolls back on error
- Shows error toast with retry button on failure
- Silent operation (no success toast for minor updates)

---

### useMoveCard

Move a card between lists or reorder within a list.

**Signature**:

```typescript
function useMoveCard(
  options?: MutationOptions<Card, MoveCardDto>,
): UseMutationResult<Card, MoveCardDto>;
```

**Example**:

```typescript
const { mutate: moveCard } = useMoveCard();

const handleDragEnd = (result: DropResult) => {
  moveCard({
    cardId: result.draggableId,
    sourceListId: result.source.droppableId,
    targetListId: result.destination.droppableId,
    position: result.destination.index,
  });
};
```

**Behavior**:

- Optimistic update (moves card in UI immediately)
- Rolls back on error
- Silent operation (no success toast)
- Shows error toast with retry button on failure
- High-frequency operation (can be debounced)

---

### useDeleteCard

Delete a card.

**Signature**:

```typescript
function useDeleteCard(
  cardId: string,
  options?: MutationOptions<void, void>,
): UseMutationResult<void, void>;
```

**Behavior**:

- Shows confirmation dialog before executing
- Optimistic update (removes from UI immediately)
- Rolls back on error
- Shows success toast: "Card deleted"
- Shows error toast with retry button on failure

---

## Error Handling Contract

All hooks follow this error handling pattern:

### Automatic Retry

**Network Errors** (timeout, connection failed):

- Auto-retry up to 3 times with exponential backoff
- Delays: 1s, 2s, 4s
- Shows error toast only after all retries fail

**4xx Client Errors** (validation, auth):

- No auto-retry
- Shows error toast immediately
- Includes validation details if available

**5xx Server Errors**:

- Auto-retry once (2s delay)
- Shows error toast if retry fails

### Toast Notification Format

**Success Toast**:

```typescript
toast.success({
  title: 'Board created successfully',
});
```

**Error Toast with Retry**:

```typescript
toast.error({
  title: 'Failed to create board',
  description: error.message,
  action: {
    label: 'Retry',
    onClick: () => retry(),
  },
});
```

**Validation Error Toast**:

```typescript
toast.error({
  title: 'Validation failed',
  description: 'Name is required and must be under 100 characters',
});
```

---

## Optimistic Update Contract

Mutation hooks that support optimistic updates follow this pattern:

1. **Immediately update local state** (UI shows change instantly)
2. **Send request to backend**
3. **On success**: Keep optimistic state, sync with server response
4. **On error**: Rollback to previous state, show error toast

**Example Flow**:

```typescript
// 1. User clicks "Delete Card"
deleteCard(); // Hook called

// 2. Optimistic update (immediate)
// - Remove card from UI
// - User sees change instantly (<50ms)

// 3. API request sent
// - Async call to DELETE /cards/:id

// 4a. Success path
// - Keep card removed
// - Show success toast

// 4b. Error path
// - Restore card to original position
// - Show error toast with retry button
```

**Operations with Optimistic Updates**:

- ✅ Create card/list (add to UI immediately)
- ✅ Update card/list/board (update UI immediately)
- ✅ Delete card/list (remove from UI immediately)
- ✅ Move card (update position immediately)
- ✅ Reorder lists (update order immediately)

**Operations without Optimistic Updates**:

- ❌ Get operations (always fetch from server)
- ❌ Operations with complex server-side logic

---

## Hook Composition Examples

Hooks can be composed for complex workflows:

**Example 1: Create card and immediately open it**

```typescript
const { mutate: createCard } = useCreateCard(listId, {
  onSuccess: (card) => {
    navigate(`/card/${card.id}`);
  },
});
```

**Example 2: Update card and refresh board**

```typescript
const { refetch: refetchBoard } = useGetBoard(boardId);
const { mutate: updateCard } = useUpdateCard(cardId, {
  onSuccess: () => {
    refetchBoard();
  },
});
```

**Example 3: Multiple operations in sequence**

```typescript
const { mutate: createList } = useCreateList(boardId);
const { mutate: createCard } = useCreateCard();

const handleCreateListWithCards = async () => {
  const list = await createList({ boardId, name: 'New List' });
  await createCard({ listId: list.id, title: 'First Card' });
  await createCard({ listId: list.id, title: 'Second Card' });
};
```

---

## Testing Contract

All hooks must be testable with React Testing Library:

**Query Hook Test Pattern**:

```typescript
test('useGetBoard fetches board data', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useGetBoard('board-123'));

  // Initially loading
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeNull();

  // Wait for fetch
  await waitForNextUpdate();

  // Data loaded
  expect(result.current.loading).toBe(false);
  expect(result.current.data).toMatchObject({ id: 'board-123' });
});
```

**Mutation Hook Test Pattern**:

```typescript
test('useCreateCard creates a card', async () => {
  const { result } = renderHook(() => useCreateCard('list-123'));

  // Call mutate
  await act(async () => {
    await result.current.mutate({
      listId: 'list-123',
      title: 'Test Card',
    });
  });

  // Check result
  expect(result.current.data).toMatchObject({ title: 'Test Card' });
  expect(result.current.loading).toBe(false);
});
```

---

## Summary

This contract defines:

- ✅ Consistent hook signatures (query vs mutation patterns)
- ✅ Standard return types (data, loading, error, etc.)
- ✅ Error handling behavior (retry logic, toast notifications)
- ✅ Optimistic update pattern
- ✅ Hook composition examples
- ✅ Testing patterns

All custom hooks must follow this contract to ensure consistency across the application.
