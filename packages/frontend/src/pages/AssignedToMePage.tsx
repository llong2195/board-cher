import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardModal } from '../components/card/CardModal';
import axios from 'axios';

/**
 * AssignedToMePage Component (T220)
 * User Story 6: Card Assignment and Notifications
 *
 * Displays all cards assigned to the current user across all accessible boards.
 * Features filtering, sorting by due date, and pagination.
 */

interface CardAssignment {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  position: number;
  isArchived: boolean;
  assigneeCount: number;
  list: {
    id: string;
    name: string;
    boardId: string;
  };
  board: {
    id: string;
    name: string;
    organizationId: string;
  };
}

interface PaginatedCardsResponse {
  data: CardAssignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AssignedToMePage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Card modal state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const loadAssignedCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await axios.get<PaginatedCardsResponse>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/cards/assigned-to-me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page,
            limit,
          },
        },
      );

      setCards(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to load assigned cards:', err);
      setError('Failed to load your assigned cards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadAssignedCards();
  }, [loadAssignedCards]);

  const handleCardClick = (card: CardAssignment) => {
    setSelectedCardId(card.id);
    setSelectedBoardId(card.board.id);
  };

  const handleCloseModal = () => {
    setSelectedCardId(null);
    setSelectedBoardId(null);
  };

  const handleCardUpdate = () => {
    // Reload cards to reflect any changes
    loadAssignedCards();
  };

  const navigateToBoard = (boardId: string) => {
    navigate(`/boards/${boardId}`);
  };

  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  const getDueDateColor = (dueDate: string | null): string => {
    if (!dueDate) return 'text-gray-500';

    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 font-medium';
    if (diffDays === 0) return 'text-orange-600 font-medium';
    if (diffDays <= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assigned to Me</h1>
              <p className="mt-1 text-sm text-gray-500">
                {total > 0
                  ? `${total} card${total > 1 ? 's' : ''} assigned to you`
                  : 'No cards assigned to you yet'}
              </p>
            </div>
            <button
              onClick={() => navigate('/boards')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Boards
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-500">Loading your assigned cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned cards</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any cards assigned to you yet.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/boards')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Boards
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="p-4">
                    {/* Board and List info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToBoard(card.board.id);
                        }}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {card.board.name}
                      </button>
                      <span>›</span>
                      <span className="truncate">{card.list.name}</span>
                    </div>

                    {/* Card title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {card.title}
                    </h3>

                    {/* Card description */}
                    {card.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{card.description}</p>
                    )}

                    {/* Card metadata */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      {/* Due date */}
                      <div className="flex items-center gap-1">
                        <svg
                          className={`w-4 h-4 ${getDueDateColor(card.dueDate)}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className={`text-xs ${getDueDateColor(card.dueDate)}`}>
                          {formatDueDate(card.dueDate)}
                        </span>
                      </div>

                      {/* Assignee count */}
                      {card.assigneeCount > 1 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          <span>{card.assigneeCount} assignees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                      <span className="font-medium">{total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Card Modal */}
      {selectedCardId && selectedBoardId && (
        <CardModal
          cardId={selectedCardId}
          boardId={selectedBoardId}
          isOpen={!!selectedCardId}
          onClose={handleCloseModal}
          onUpdate={handleCardUpdate}
          wsToken={localStorage.getItem('authToken')}
        />
      )}
    </div>
  );
}
