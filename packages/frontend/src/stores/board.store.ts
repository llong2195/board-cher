import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { boardApi, type Board } from '../services/api/board.api';
import { listApi, type List } from '../services/api/list.api';
import { cardApi, type Card } from '../services/api/card.api';

/**
 * Board State Store
 * Manages the state of the current board, its lists, and cards
 */

export interface BoardState {
  // Current board data
  board: Board | null;
  lists: List[];
  cards: Record<string, Card[]>; // Keyed by listId

  // Loading states
  isLoadingBoard: boolean;
  isLoadingLists: boolean;
  isLoadingCards: Record<string, boolean>;

  // Error states
  error: string | null;

  // Actions
  loadBoard: (boardId: string) => Promise<void>;
  loadLists: (boardId: string) => Promise<void>;
  loadCards: (listId: string) => Promise<void>;

  // Board actions
  createBoard: (dto: {
    organizationId: string;
    name: string;
    description?: string;
    color?: string;
  }) => Promise<Board>;
  updateBoard: (
    boardId: string,
    dto: { name?: string; description?: string; color?: string },
  ) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;

  // List actions
  createList: (boardId: string, name: string) => Promise<void>;
  moveList: (listId: string, newPosition: number) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;

  // Card actions
  createCard: (listId: string, title: string, description?: string) => Promise<void>;
  moveCard: (cardId: string, targetListId: string, position: number) => Promise<void>;
  updateCard: (
    cardId: string,
    dto: { title?: string; description?: string; dueDate?: Date },
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;

  // Real-time update handlers
  handleListCreated: (list: List) => void;
  handleListMoved: (list: List) => void;
  handleCardCreated: (card: Card) => void;
  handleCardMoved: (card: Card) => void;
  handleCardUpdated: (card: Card) => void;

  // Utility
  reset: () => void;
}

const initialState = {
  board: null,
  lists: [],
  cards: {},
  isLoadingBoard: false,
  isLoadingLists: false,
  isLoadingCards: {},
  error: null,
};

export const useBoardStore = create<BoardState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Load board data
      loadBoard: async (boardId: string) => {
        set({ isLoadingBoard: true, error: null });
        try {
          const board = await boardApi.getBoard(boardId);
          set({ board, isLoadingBoard: false });

          // Auto-load lists after board is loaded
          get().loadLists(boardId);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load board',
            isLoadingBoard: false,
          });
        }
      },

      // Load lists for a board
      loadLists: async (boardId: string) => {
        set({ isLoadingLists: true, error: null });
        try {
          const lists = await listApi.getBoardLists(boardId);
          set({ lists, isLoadingLists: false });

          // Auto-load cards for each list
          lists.forEach((list) => {
            get().loadCards(list.id);
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load lists',
            isLoadingLists: false,
          });
        }
      },

      // Load cards for a list
      loadCards: async (listId: string) => {
        set((state) => ({
          isLoadingCards: { ...state.isLoadingCards, [listId]: true },
          error: null,
        }));
        try {
          const cards = await cardApi.getListCards(listId);
          set((state) => ({
            cards: { ...state.cards, [listId]: cards },
            isLoadingCards: { ...state.isLoadingCards, [listId]: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to load cards',
            isLoadingCards: { ...state.isLoadingCards, [listId]: false },
          }));
        }
      },

      // Create board
      createBoard: async (dto) => {
        try {
          const board = await boardApi.createBoard(dto);
          set({ board });
          return board;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create board' });
          throw error;
        }
      },

      // Update board
      updateBoard: async (boardId: string, dto) => {
        try {
          const board = await boardApi.updateBoard(boardId, dto);
          set({ board });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update board' });
          throw error;
        }
      },

      // Delete board
      deleteBoard: async (boardId: string) => {
        try {
          await boardApi.deleteBoard(boardId);
          set(initialState);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete board' });
          throw error;
        }
      },

      // Create list
      createList: async (boardId: string, name: string) => {
        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempList: List = {
          id: tempId,
          boardId,
          name,
          position: get().lists.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const previousLists = get().lists;
        const previousCards = get().cards;

        // Optimistically add list to UI
        set((state) => ({
          lists: [...state.lists, tempList].sort((a, b) => a.position - b.position),
          cards: { ...state.cards, [tempId]: [] },
        }));

        try {
          const list = await listApi.createList(boardId, { name });

          // Replace temp list with real list
          set((state) => ({
            lists: state.lists
              .map((l) => (l.id === tempId ? list : l))
              .sort((a, b) => a.position - b.position),
            cards: {
              ...state.cards,
              [list.id]: state.cards[tempId] || [],
              [tempId]: undefined!, // Remove temp ID
            },
          }));

          // Clean up temp ID
          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [tempId]: _, ...remainingCards } = state.cards;
            return { cards: remainingCards };
          });
        } catch (error) {
          // Rollback on error
          set({
            lists: previousLists,
            cards: previousCards,
            error: error instanceof Error ? error.message : 'Failed to create list',
          });
          console.error('Failed to create list, rolled back:', error);
          throw error;
        }
      },

      // Move list
      moveList: async (listId: string, newPosition: number) => {
        const previousLists = get().lists;

        // Optimistically update position
        set((state) => ({
          lists: state.lists
            .map((l) => (l.id === listId ? { ...l, position: newPosition } : l))
            .sort((a, b) => a.position - b.position),
        }));

        try {
          const updatedList = await listApi.moveList(listId, newPosition);

          // Update with server response
          set((state) => ({
            lists: state.lists
              .map((l) => (l.id === listId ? updatedList : l))
              .sort((a, b) => a.position - b.position),
          }));
        } catch (error) {
          // Rollback on error
          set({
            lists: previousLists,
            error: error instanceof Error ? error.message : 'Failed to move list',
          });
          console.error('Failed to move list, rolled back:', error);
          throw error;
        }
      },

      // Delete list
      deleteList: async (listId: string) => {
        try {
          await listApi.deleteList(listId);
          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [listId]: _, ...remainingCards } = state.cards;
            return {
              lists: state.lists.filter((l) => l.id !== listId),
              cards: remainingCards,
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete list' });
          throw error;
        }
      },

      // Create card
      createCard: async (listId: string, title: string, description?: string) => {
        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempCard: Card = {
          id: tempId,
          listId,
          title,
          description,
          position: (get().cards[listId]?.length || 0) + 1,
          isArchived: false,
          createdBy: '', // Will be filled by server
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const previousCards = get().cards;

        // Optimistically add card to UI
        set((state) => ({
          cards: {
            ...state.cards,
            [listId]: [...(state.cards[listId] || []), tempCard].sort(
              (a, b) => a.position - b.position,
            ),
          },
        }));

        try {
          const card = await cardApi.createCard(listId, { title, description });

          // Replace temp card with real card
          set((state) => ({
            cards: {
              ...state.cards,
              [listId]: state.cards[listId]
                .map((c) => (c.id === tempId ? card : c))
                .sort((a, b) => a.position - b.position),
            },
          }));
        } catch (error) {
          // Rollback on error
          set({
            cards: previousCards,
            error: error instanceof Error ? error.message : 'Failed to create card',
          });
          console.error('Failed to create card, rolled back:', error);
          throw error;
        }
      },

      // Move card
      moveCard: async (cardId: string, targetListId: string, position: number) => {
        // Store previous state for rollback
        const previousCards = get().cards;
        const sourceListId = Object.keys(previousCards).find((listId) =>
          previousCards[listId].some((c) => c.id === cardId),
        );

        if (!sourceListId) {
          console.error('Source list not found for card:', cardId);
          return;
        }

        const cardToMove = previousCards[sourceListId].find((c) => c.id === cardId);
        if (!cardToMove) {
          console.error('Card not found:', cardId);
          return;
        }

        // Optimistically update UI immediately
        set((state) => {
          const newCards = { ...state.cards };

          // Remove from source list
          newCards[sourceListId] = newCards[sourceListId].filter((c) => c.id !== cardId);

          // Add to target list with new position
          const movedCard = { ...cardToMove, listId: targetListId, position };
          newCards[targetListId] = [...(newCards[targetListId] || []), movedCard].sort(
            (a, b) => a.position - b.position,
          );

          return { cards: newCards };
        });

        // Make API call
        try {
          const movedCard = await cardApi.moveCard(cardId, { targetListId, position });

          // Update with server response (may have adjusted position)
          set((state) => {
            const newCards = { ...state.cards };
            newCards[targetListId] = newCards[targetListId]
              .map((c) => (c.id === cardId ? movedCard : c))
              .sort((a, b) => a.position - b.position);

            return { cards: newCards };
          });
        } catch (error) {
          // Rollback to previous state on error
          set({
            cards: previousCards,
            error: error instanceof Error ? error.message : 'Failed to move card',
          });
          console.error('Failed to move card, rolled back:', error);
          throw error;
        }
      },

      // Update card
      // Update card
      updateCard: async (cardId: string, dto) => {
        const previousCards = get().cards;
        const listId = Object.keys(previousCards).find((lid) =>
          previousCards[lid].some((c) => c.id === cardId),
        );

        if (!listId) {
          console.error('Card not found for update:', cardId);
          return;
        }

        // Optimistically update card
        set((state) => ({
          cards: {
            ...state.cards,
            [listId]: state.cards[listId].map((c) =>
              c.id === cardId ? { ...c, ...dto, updatedAt: new Date() } : c,
            ),
          },
        }));

        try {
          const updatedCard = await cardApi.updateCard(cardId, dto);

          // Update with server response
          set((state) => ({
            cards: {
              ...state.cards,
              [listId]: state.cards[listId].map((c) => (c.id === cardId ? updatedCard : c)),
            },
          }));
        } catch (error) {
          // Rollback on error
          set({
            cards: previousCards,
            error: error instanceof Error ? error.message : 'Failed to update card',
          });
          console.error('Failed to update card, rolled back:', error);
          throw error;
        }
      },

      // Delete card
      deleteCard: async (cardId: string) => {
        try {
          await cardApi.deleteCard(cardId);

          set((state) => {
            const listId = Object.keys(state.cards).find((listId) =>
              state.cards[listId].some((c) => c.id === cardId),
            );

            if (!listId) return state;

            return {
              cards: {
                ...state.cards,
                [listId]: state.cards[listId].filter((c) => c.id !== cardId),
              },
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete card' });
          throw error;
        }
      },

      // Real-time update handlers
      handleListCreated: (list: List) => {
        set((state) => ({
          lists: [...state.lists, list].sort((a, b) => a.position - b.position),
          cards: { ...state.cards, [list.id]: [] },
        }));
      },

      handleListMoved: (list: List) => {
        set((state) => ({
          lists: state.lists
            .map((l) => (l.id === list.id ? list : l))
            .sort((a, b) => a.position - b.position),
        }));
      },

      handleCardCreated: (card: Card) => {
        set((state) => ({
          cards: {
            ...state.cards,
            [card.listId]: [...(state.cards[card.listId] || []), card].sort(
              (a, b) => a.position - b.position,
            ),
          },
        }));
      },

      handleCardMoved: (card: Card) => {
        set((state) => {
          // Find card's previous list
          const previousListId = Object.keys(state.cards).find((listId) =>
            state.cards[listId].some((c) => c.id === card.id),
          );

          if (!previousListId) {
            // Card not found in current state, just add it
            return {
              cards: {
                ...state.cards,
                [card.listId]: [...(state.cards[card.listId] || []), card].sort(
                  (a, b) => a.position - b.position,
                ),
              },
            };
          }

          const newCards = { ...state.cards };

          // Remove from previous list
          newCards[previousListId] = newCards[previousListId].filter((c) => c.id !== card.id);

          // Add to new list
          newCards[card.listId] = [...(newCards[card.listId] || []), card].sort(
            (a, b) => a.position - b.position,
          );

          return { cards: newCards };
        });
      },

      handleCardUpdated: (card: Card) => {
        set((state) => ({
          cards: {
            ...state.cards,
            [card.listId]: (state.cards[card.listId] || []).map((c) =>
              c.id === card.id ? card : c,
            ),
          },
        }));
      },

      // Reset store
      reset: () => set(initialState),
    }),
    {
      name: 'board-store',
    },
  ),
);
