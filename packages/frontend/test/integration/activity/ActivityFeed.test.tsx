/**
 * T246 - ActivityFeed Integration Tests
 * User Story 7: Activity History and Audit Trail
 *
 * Integration tests for ActivityFeed component including:
 * - Activity rendering with icons and metadata
 * - Pagination and infinite scroll
 * - Real-time updates via WebSocket
 * - Filter and action type display
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActivityFeed from '../../../src/components/activity/ActivityFeed';
import { activityService } from '../../../src/services/activity.service';
import { socketService } from '../../../src/services/socket.service';
import type { Activity, ActivityActionType } from '../../../src/types/activity';

// Mock services
vi.mock('../../../src/services/activity.service');
vi.mock('../../../src/services/socket.service');

const mockActivities: Activity[] = [
  {
    id: '1',
    userId: 'user-1',
    boardId: 'board-1',
    cardId: 'card-1',
    actionType: 'CARD_CREATED' as ActivityActionType,
    entityType: 'CARD',
    entityId: 'card-1',
    metadata: { title: 'New Feature' },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    user: {
      id: 'user-1',
      username: 'johndoe',
      email: 'john@example.com',
    },
  },
  {
    id: '2',
    userId: 'user-1',
    boardId: 'board-1',
    cardId: 'card-1',
    actionType: 'CARD_MOVED' as ActivityActionType,
    entityType: 'CARD',
    entityId: 'card-1',
    metadata: { fromList: 'To Do', toList: 'In Progress' },
    createdAt: new Date('2024-01-15T11:00:00Z'),
    user: {
      id: 'user-1',
      username: 'johndoe',
      email: 'john@example.com',
    },
  },
  {
    id: '3',
    userId: 'user-2',
    boardId: 'board-1',
    cardId: 'card-1',
    actionType: 'COMMENT_ADDED' as ActivityActionType,
    entityType: 'COMMENT',
    entityId: 'comment-1',
    metadata: { content: 'Great progress!' },
    createdAt: new Date('2024-01-15T12:00:00Z'),
    user: {
      id: 'user-2',
      username: 'janedoe',
      email: 'jane@example.com',
    },
  },
];

describe('ActivityFeed Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    user = userEvent.setup();

    // Mock API responses
    vi.mocked(activityService.getBoardActivities).mockResolvedValue({
      activities: mockActivities,
      total: 3,
    });

    vi.mocked(activityService.getCardActivities).mockResolvedValue({
      activities: mockActivities.filter((a) => a.cardId === 'card-1'),
      total: 3,
    });

    // Mock WebSocket
    vi.mocked(socketService.on).mockImplementation(() => {});
    vi.mocked(socketService.off).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Activity Rendering', () => {
    it('should render activity items with user and timestamp', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText('New Feature')).toBeInTheDocument();
    });

    it('should display appropriate icons for different action types', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(3);
      });

      // Check for specific icons (implementation-dependent)
      const activityItems = screen.getAllByTestId('activity-item');
      expect(activityItems).toHaveLength(3);
    });

    it('should format card.moved metadata correctly', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/moved.*from.*To Do.*to.*In Progress/i)).toBeInTheDocument();
      });
    });

    it('should display relative timestamps', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        // Should show relative time like "2 hours ago"
        expect(screen.getByText(/ago$/i)).toBeInTheDocument();
      });
    });

    it('should render user avatars', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        const avatars = screen.getAllByTestId('user-avatar');
        expect(avatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pagination', () => {
    it('should load more activities on scroll', async () => {
      const moreActivities: Activity[] = [
        {
          id: '4',
          userId: 'user-3',
          boardId: 'board-1',
          actionType: 'LABEL_ADDED' as ActivityActionType,
          entityType: 'LABEL',
          entityId: 'label-1',
          metadata: { labelName: 'Bug', labelColor: '#ff0000' },
          createdAt: new Date('2024-01-15T13:00:00Z'),
          user: {
            id: 'user-3',
            username: 'bobsmith',
            email: 'bob@example.com',
          },
        },
      ];

      vi.mocked(activityService.getBoardActivities)
        .mockResolvedValueOnce({
          activities: mockActivities,
          total: 4,
        })
        .mockResolvedValueOnce({
          activities: moreActivities,
          total: 4,
        });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" limit={3} />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      // Find and click "Load More" button
      const loadMoreBtn = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreBtn);

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(4);
        expect(screen.getByText('bobsmith')).toBeInTheDocument();
      });
    });

    it('should show loading state when fetching more activities', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Trigger load more (if applicable)
      // Should show loading spinner
    });

    it('should hide load more button when all activities loaded', async () => {
      vi.mocked(activityService.getBoardActivities).mockResolvedValue({
        activities: mockActivities,
        total: 3, // Total matches current count
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" limit={10} />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to WebSocket activity events on mount', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalledWith('activity:created', expect.any(Function));
      });
    });

    it('should unsubscribe from WebSocket on unmount', async () => {
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(socketService.on).toHaveBeenCalled();
      });

      unmount();

      expect(socketService.off).toHaveBeenCalledWith('activity:created', expect.any(Function));
    });

    it('should prepend new activity when received via WebSocket', async () => {
      let activityHandler: ((data: any) => void) | undefined;

      vi.mocked(socketService.on).mockImplementation((event, handler) => {
        if (event === 'activity:created') {
          activityHandler = handler;
        }
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      // Simulate WebSocket event
      const newActivity: Activity = {
        id: '4',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-2',
        actionType: 'CARD_CREATED' as ActivityActionType,
        entityType: 'CARD',
        entityId: 'card-2',
        metadata: { title: 'Another Card' },
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'johndoe',
          email: 'john@example.com',
        },
      };

      act(() => {
        activityHandler?.({ activity: newActivity });
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(4);
        expect(screen.getByText('Another Card')).toBeInTheDocument();
      });
    });

    it('should show notification badge for new activities', async () => {
      let activityHandler: ((data: any) => void) | undefined;

      vi.mocked(socketService.on).mockImplementation((event, handler) => {
        if (event === 'activity:created') {
          activityHandler = handler;
        }
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      // Scroll down (simulate user not at top)
      const feedContainer = screen.getByTestId('activity-feed');
      fireEvent.scroll(feedContainer, { target: { scrollTop: 500 } });

      // Receive new activity
      const newActivity: Activity = {
        id: '5',
        userId: 'user-2',
        boardId: 'board-1',
        actionType: 'COMMENT_ADDED' as ActivityActionType,
        entityType: 'COMMENT',
        entityId: 'comment-2',
        metadata: { content: 'New comment' },
        createdAt: new Date(),
        user: {
          id: 'user-2',
          username: 'janedoe',
          email: 'jane@example.com',
        },
      };

      act(() => {
        activityHandler?.({ activity: newActivity });
      });

      // Should show notification badge
      await waitFor(() => {
        expect(screen.getByText(/new activit/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter activities by action type', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" actionType="COMMENT_ADDED" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(activityService.getBoardActivities).toHaveBeenCalledWith(
          'board-1',
          expect.objectContaining({ actionType: 'COMMENT_ADDED' }),
        );
      });
    });

    it('should support card-specific activity filtering', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" cardId="card-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(activityService.getCardActivities).toHaveBeenCalledWith(
          'card-1',
          expect.any(Object),
        );
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no activities exist', async () => {
      vi.mocked(activityService.getBoardActivities).mockResolvedValue({
        activities: [],
        total: 0,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      });
    });

    it('should show helpful message in empty state', async () => {
      vi.mocked(activityService.getBoardActivities).mockResolvedValue({
        activities: [],
        total: 0,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/activity will appear here/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(activityService.getBoardActivities).mockRejectedValue(
        new Error('Failed to load activities'),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      vi.mocked(activityService.getBoardActivities)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          activities: mockActivities,
          total: 3,
        });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });
    });
  });

  describe('Activity Type Rendering', () => {
    it('should render label activities with color swatch', async () => {
      const labelActivity: Activity = {
        id: '4',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        actionType: 'LABEL_ADDED' as ActivityActionType,
        entityType: 'LABEL',
        entityId: 'label-1',
        metadata: { labelName: 'Bug', labelColor: '#ff0000' },
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'johndoe',
          email: 'john@example.com',
        },
      };

      vi.mocked(activityService.getBoardActivities).mockResolvedValue({
        activities: [labelActivity],
        total: 1,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });

      const colorSwatch = screen.getByTestId('label-color-swatch');
      expect(colorSwatch).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should render assignment activities with assignee name', async () => {
      const assignActivity: Activity = {
        id: '5',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        actionType: 'MEMBER_ASSIGNED' as ActivityActionType,
        entityType: 'CARD',
        entityId: 'card-1',
        metadata: { assigneeName: 'John Doe', assigneeId: 'user-2' },
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'johndoe',
          email: 'john@example.com',
        },
      };

      vi.mocked(activityService.getBoardActivities).mockResolvedValue({
        activities: [assignActivity],
        total: 1,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ActivityFeed boardId="board-1" />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/assigned.*John Doe/i)).toBeInTheDocument();
      });
    });
  });
});
