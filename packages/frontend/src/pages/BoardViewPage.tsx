import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Board } from '../components/board/Board';
import { BoardSkeleton } from '../components/skeleton/BoardSkeleton';
import { useBoardStore } from '../stores/board.store';
import { useBoardRealtime } from '../hooks/useBoardRealtime';
import type { List as StoreList } from '../services/api/list.api';
import type { Card as StoreCard } from '../services/api/card.api';

/**
 * BoardViewPage
 * Main page for viewing and interacting with a board
 * Includes WebSocket integration for real-time updates
 */

export function BoardViewPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const board = useBoardStore((state) => state.board);
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const reset = useBoardStore((state) => state.reset);
  const error = useBoardStore((state) => state.error);
  const isLoading = useBoardStore((state) => state.isLoadingBoard);

  // Get real-time event handlers from store
  const handleListCreated = useBoardStore((state) => state.handleListCreated);
  const handleListMoved = useBoardStore((state) => state.handleListMoved);
  const handleCardCreated = useBoardStore((state) => state.handleCardCreated);
  const handleCardMoved = useBoardStore((state) => state.handleCardMoved);
  const handleCardUpdated = useBoardStore((state) => state.handleCardUpdated);
  const lists = useBoardStore((state) => state.lists);
  const cards = useBoardStore((state) => state.cards);

  // Initialize WebSocket connection with real-time event handlers
  const { isConnected } = useBoardRealtime(
    {
      url: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
      token: localStorage.getItem('authToken'),
      autoConnect: true,
    },
    {
      boardId: boardId || null,
      onListCreated: (list) => {
        // Convert hook's List type to store's List type by casting
        handleListCreated(list as unknown as StoreList);
      },
      onListMoved: ({ listId, position }) => {
        // Find the list and call handler
        const list = lists.find((l) => l.id === listId);
        if (list) {
          handleListMoved({ ...list, position });
        }
      },
      onCardCreated: (card) => {
        // Convert hook's Card type to store's Card type by casting
        handleCardCreated(card as unknown as StoreCard);
      },
      onCardMoved: ({ cardId, listId, position }) => {
        // Find the card and call handler
        const allCards = Object.values(cards).flat();
        const card = allCards.find((c) => c.id === cardId);
        if (card) {
          handleCardMoved({ ...card, listId, position });
        }
      },
      onCardUpdated: (cardUpdate) => {
        // Find the card and merge updates
        const allCards = Object.values(cards).flat();
        const card = allCards.find((c) => c.id === cardUpdate.id);
        if (card) {
          handleCardUpdated({ ...card, ...cardUpdate });
        }
      },
    },
  );

  useEffect(() => {
    if (!boardId) {
      navigate('/boards');
      return;
    }

    // Load board data
    loadBoard(boardId);

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [boardId, loadBoard, navigate, reset]);

  if (isLoading && !board) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Skeleton Loading State */}
        <BoardSkeleton />
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Failed to load board</h2>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/boards')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Boards
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* WebSocket Status Indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Reconnecting to real-time updates...
          </span>
        </div>
      )}

      {/* Board Content */}
      <Board boardId={boardId!} />
    </div>
  );
}
