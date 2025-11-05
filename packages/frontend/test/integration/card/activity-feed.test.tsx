/**
 * T246 [US7] Frontend Activity Feed Test
 *
 * Integration tests for the activity feed component that displays
 * card and board activity history with real-time updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityFeed } from '@/components/card/ActivityFeed';
import { activityApi } from '@/services/api/activity.api';

// Mock the API
vi.mock('@/services/api/activity.api');

describe('ActivityFeed Component - T246', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      userId: 'user-1',
      userName: 'John Doe',
      actionType: 'CARD_CREATED',
      entityType: 'CARD',
      entityId: 'card-1',
      boardId: 'board-1',
      cardId: 'card-1',
      description: 'John Doe created this card',
      metadata: { cardTitle: 'Test Card' },
      createdAt: new Date('2025-11-01T10:00:00Z'),
    },
    {
      id: 'activity-2',
      userId: 'user-2',
      userName: 'Jane Smith',
      actionType: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: 'comment-1',
      boardId: 'board-1',
      cardId: 'card-1',
      description: 'Jane Smith added a comment',
      metadata: { commentPreview: 'This is a test comment' },
      createdAt: new Date('2025-11-01T11:00:00Z'),
    },
    {
      id: 'activity-3',
      userId: 'user-1',
      userName: 'John Doe',
      actionType: 'CARD_MOVED',
      entityType: 'CARD',
      entityId: 'card-1',
      boardId: 'board-1',
      cardId: 'card-1',
      description: 'John Doe moved this card',
      metadata: {
        fromListId: 'list-1',
        toListId: 'list-2',
        fromListName: 'To Do',
        toListName: 'In Progress',
      },
      createdAt: new Date('2025-11-01T12:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Activity Feed', () => {
    it('should render activity feed for a card', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe created this card')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith added a comment')).toBeInTheDocument();
        expect(screen.getByText('John Doe moved this card')).toBeInTheDocument();
      });
    });

    it('should display activities in reverse chronological order', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        const activities = screen.getAllByTestId('activity-item');
        expect(activities).toHaveLength(3);

        // Most recent first
        expect(activities[0]).toHaveTextContent('John Doe moved this card');
        expect(activities[1]).toHaveTextContent('Jane Smith added a comment');
        expect(activities[2]).toHaveTextContent('John Doe created this card');
      });
    });

    it('should show loading state while fetching activities', () => {
      vi.mocked(activityApi.getCardActivity).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      render(<ActivityFeed cardId="card-1" />);

      expect(screen.getByTestId('activity-loading')).toBeInTheDocument();
    });

    it('should handle empty activity list', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText(/no activity/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(activityApi.getCardActivity).mockRejectedValue(
        new Error('Failed to fetch activities'),
      );

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
      });
    });
  });

  describe('Board Activity Feed', () => {
    it('should render activity feed for a board', async () => {
      vi.mocked(activityApi.getBoardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed boardId="board-1" />);

      await waitFor(() => {
        expect(activityApi.getBoardActivity).toHaveBeenCalledWith('board-1', 1, 20);
        expect(screen.getByText('John Doe created this card')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should load more activities when scrolling to bottom', async () => {
      const page1Activities = mockActivities.slice(0, 2);
      const page2Activities = [mockActivities[2]];

      vi.mocked(activityApi.getCardActivity)
        .mockResolvedValueOnce({
          data: page1Activities,
          pagination: {
            page: 1,
            limit: 2,
            total: 3,
            pages: 2,
          },
        })
        .mockResolvedValueOnce({
          data: page2Activities,
          pagination: {
            page: 2,
            limit: 2,
            total: 3,
            pages: 2,
          },
        });

      const { container } = render(<ActivityFeed cardId="card-1" />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
      });

      // Simulate scrolling to bottom
      const scrollContainer = container.querySelector('[data-testid="activity-feed-container"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        scrollContainer.dispatchEvent(new Event('scroll'));
      }

      // Wait for second page to load
      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });
    });

    it('should not load more if already at last page', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1, // Only one page
        },
      });

      const { container } = render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      const initialCallCount = vi.mocked(activityApi.getCardActivity).mock.calls.length;

      // Simulate scrolling to bottom
      const scrollContainer = container.querySelector('[data-testid="activity-feed-container"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        scrollContainer.dispatchEvent(new Event('scroll'));
      }

      // Wait a bit and verify no additional calls were made
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(vi.mocked(activityApi.getCardActivity).mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Activity Item Rendering', () => {
    it('should render user avatar and name', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: [mockActivities[0]],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should format timestamps correctly', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: [mockActivities[0]],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        // Should show relative time like "2 hours ago"
        expect(screen.getByTestId('activity-timestamp')).toBeInTheDocument();
      });
    });

    it('should render action-specific icons', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        const icons = screen.getAllByTestId('activity-icon');
        expect(icons).toHaveLength(3);
      });
    });

    it('should render metadata for card moved event', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: [mockActivities[2]], // CARD_MOVED event
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText(/from.*To Do.*to.*In Progress/i)).toBeInTheDocument();
      });
    });

    it('should render metadata for comment added event', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: [mockActivities[1]], // COMMENT_ADDED event
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should prepend new activity when received via WebSocket', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities.slice(0, 2),
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      });

      const { rerender } = render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
      });

      // Simulate receiving new activity via WebSocket
      const newActivity = {
        id: 'activity-new',
        userId: 'user-3',
        userName: 'Alice Johnson',
        actionType: 'LABEL_ADDED',
        entityType: 'LABEL',
        entityId: 'label-1',
        boardId: 'board-1',
        cardId: 'card-1',
        description: 'Alice Johnson added label "urgent"',
        metadata: { labelName: 'urgent', labelColor: 'red' },
        createdAt: new Date(),
      };

      // Trigger activity update (this would normally come from WebSocket hook)
      rerender(<ActivityFeed cardId="card-1" newActivity={newActivity} />);

      await waitFor(() => {
        const activities = screen.getAllByTestId('activity-item');
        expect(activities).toHaveLength(3);
        expect(activities[0]).toHaveTextContent('Alice Johnson added label "urgent"');
      });
    });

    it('should not duplicate activities', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      const { rerender } = render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });

      // Try to add duplicate activity
      rerender(<ActivityFeed cardId="card-1" newActivity={mockActivities[0]} />);

      await waitFor(() => {
        // Should still have 3 activities, not 4
        expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /activity feed/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      vi.mocked(activityApi.getCardActivity).mockResolvedValue({
        data: mockActivities,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1,
        },
      });

      render(<ActivityFeed cardId="card-1" />);

      await waitFor(() => {
        const activities = screen.getAllByTestId('activity-item');
        activities.forEach((activity) => {
          expect(activity).toHaveAttribute('tabindex', '0');
        });
      });
    });
  });
});
