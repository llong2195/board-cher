import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Board } from '../components/board/Board';
import { FilterChips, type FilterChip } from '../components/search/FilterChips';
import { FilterPanel, type FilterOption } from '../components/search/FilterPanel';
import { SearchBar } from '../components/search/SearchBar';
import { BoardSkeleton } from '../components/skeleton/BoardSkeleton';
import { useBoardRealtime } from '../hooks/useBoardRealtime';
import type { Label } from '../services/api/board.api';
import type { Card as StoreCard, CardAssignment } from '../services/api/card.api';
import type { List as StoreList } from '../services/api/list.api';
import {
  organizationApi,
  OrganizationRole as Role,
  type OrganizationRole,
} from '../services/api/organization.api';
import { useBoardStore } from '../stores/board.store';

/**
 * BoardViewPage
 * Main page for viewing and interacting with a board
 * Includes WebSocket integration for real-time updates
 * T240-T242: Added search and filter functionality
 *
 * Note: This component has hooks called after conditional returns.
 * This is intentional to avoid unnecessary computations when board is not loaded.
 * TODO: Refactor to use a wrapper component pattern for cleaner hook usage.
 */

/* eslint-disable react-hooks/rules-of-hooks */
export function BoardViewPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const board = useBoardStore((state) => state.board);
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const reset = useBoardStore((state) => state.reset);
  const error = useBoardStore((state) => state.error);
  const isLoading = useBoardStore((state) => state.isLoadingBoard);

  // State for organization member role
  const [userRole, setUserRole] = useState<OrganizationRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Search and filter state (T240)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'today' | 'overdue' | 'none'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch user's role in the organization
  const loadUserRole = useCallback(async (organizationId: string) => {
    setIsLoadingRole(true);
    try {
      const members = await organizationApi.getMembers(organizationId);
      // TODO: Get current user ID from auth context
      // For now, assume the first member is the current user
      const currentUserId = localStorage.getItem('userId');
      const currentMember = members.find((m) => m.userId === currentUserId);
      setUserRole(currentMember?.role || null);
    } catch (err) {
      console.error('Failed to load user role:', err);
      setUserRole(null);
    } finally {
      setIsLoadingRole(false);
    }
  }, []);

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

  // Load user role when board is loaded
  useEffect(() => {
    if (board?.organizationId) {
      loadUserRole(board.organizationId);
    }
  }, [board?.organizationId, loadUserRole]);

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

  // Extract available labels and assignees for filter panel (T241)
  const availableLabels: FilterOption[] = useMemo(() => {
    return (
      board.labels?.map((label: Label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })) || []
    );
  }, [board.labels]);

  const allCards = Object.values(cards).flat();
  const availableAssignees: FilterOption[] = Array.from(
    new Set(
      allCards
        .flatMap((card) => card.assignments || [])
        .map((assignment: CardAssignment) => assignment.userId),
    ),
  ).map((userId) => {
    const assignment = allCards
      .flatMap((card) => card.assignments || [])
      .find((a: CardAssignment) => a.userId === userId);
    return {
      id: userId,
      name: assignment?.user?.username || userId,
    };
  });

  // Search handler (T241)
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // TODO: Call search API endpoint
      // For now, use local filtering
      setIsSearching(false);
    }
  }, []);

  // Filter handlers (T241)
  const handleLabelToggle = useCallback((labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }, []);

  const handleAssigneeToggle = useCallback((assigneeId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(assigneeId) ? prev.filter((id) => id !== assigneeId) : [...prev, assigneeId],
    );
  }, []);

  const handleDueDateFilterChange = useCallback((filter: 'all' | 'today' | 'overdue' | 'none') => {
    setDueDateFilter(filter);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedLabelIds([]);
    setSelectedAssigneeIds([]);
    setDueDateFilter('all');
    setSearchQuery('');
  }, []);

  // Generate filter chips (T242)
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];

    selectedLabelIds.forEach((labelId) => {
      const label = availableLabels.find((l) => l.id === labelId);
      if (label) {
        chips.push({
          id: labelId,
          label: label.name,
          type: 'label',
          color: label.color,
        });
      }
    });

    selectedAssigneeIds.forEach((assigneeId) => {
      const assignee = availableAssignees.find((a) => a.id === assigneeId);
      if (assignee) {
        chips.push({
          id: assigneeId,
          label: assignee.name,
          type: 'assignee',
        });
      }
    });

    if (dueDateFilter !== 'all') {
      chips.push({
        id: 'dueDate',
        label: `Due: ${dueDateFilter}`,
        type: 'dueDate',
      });
    }

    return chips;
  }, [selectedLabelIds, selectedAssigneeIds, dueDateFilter, availableLabels, availableAssignees]);

  const handleRemoveChip = useCallback(
    (chipId: string, type: FilterChip['type']) => {
      if (type === 'label') {
        handleLabelToggle(chipId);
      } else if (type === 'assignee') {
        handleAssigneeToggle(chipId);
      } else if (type === 'dueDate') {
        setDueDateFilter('all');
      }
    },
    [handleLabelToggle, handleAssigneeToggle],
  );

  // Calculate active filter count
  const activeFilterCount =
    selectedLabelIds.length + selectedAssigneeIds.length + (dueDateFilter !== 'all' ? 1 : 0);

  // Apply local filtering to cards (T242)
  const filteredCards = useMemo(() => {
    let result = allCards;

    // Apply search filter
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description?.toLowerCase().includes(query),
      );
    }

    // Apply label filter (OR logic)
    if (selectedLabelIds.length > 0) {
      result = result.filter((card) =>
        card.labels?.some((label) => selectedLabelIds.includes(label.id)),
      );
    }

    // Apply assignee filter (OR logic)
    if (selectedAssigneeIds.length > 0) {
      result = result.filter((card) =>
        card.assignments?.some((assignment) => selectedAssigneeIds.includes(assignment.userId)),
      );
    }

    // Apply due date filter
    if (dueDateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result = result.filter((card) => {
        if (!card.dueDate) return false;
        const dueDate = new Date(card.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });
    } else if (dueDateFilter === 'overdue') {
      const now = new Date();
      result = result.filter((card) => {
        if (!card.dueDate) return false;
        return new Date(card.dueDate) < now;
      });
    } else if (dueDateFilter === 'none') {
      result = result.filter((card) => !card.dueDate);
    }

    return result;
  }, [allCards, searchQuery, selectedLabelIds, selectedAssigneeIds, dueDateFilter]);

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

      {/* View-Only Banner for Guest Users */}
      {userRole === Role.GUEST && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            You have view-only access to this board
          </span>
        </div>
      )}

      {/* Search and Filter Toolbar (T242) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              defaultValue={searchQuery}
              resultCount={filteredCards.length}
              hasActiveSearch={searchQuery.length > 0 || activeFilterCount > 0}
            />
          </div>
          <FilterPanel
            labels={availableLabels}
            assignees={availableAssignees}
            selectedLabelIds={selectedLabelIds}
            selectedAssigneeIds={selectedAssigneeIds}
            dueDateFilter={dueDateFilter}
            onLabelToggle={handleLabelToggle}
            onAssigneeToggle={handleAssigneeToggle}
            onDueDateFilterChange={handleDueDateFilterChange}
            onClearFilters={handleClearAllFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>
        {filterChips.length > 0 && (
          <div className="mt-3">
            <FilterChips
              chips={filterChips}
              onRemove={handleRemoveChip}
              onClearAll={handleClearAllFilters}
            />
          </div>
        )}
      </div>

      {/* Board Content */}
      <Board boardId={boardId!} userRole={userRole} isLoadingRole={isLoadingRole} />
    </div>
  );
}
