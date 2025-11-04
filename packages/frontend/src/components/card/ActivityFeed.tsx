/**
 * ActivityFeed Component (T259 + T263)
 * User Story 7: Activity History and Audit Trail
 *
 * Displays activity history with infinite scroll and virtualization
 * for optimal performance with large activity lists.
 * Includes real-time WebSocket updates for live activity feed.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { ActivityItem } from './ActivityItem';
import { getActivityApiClient, type Activity } from '@/services/api/activity.api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ActivityFeedProps {
  type: 'card' | 'board';
  id: string;
  maxHeight?: string;
  onActivityUpdate?: (activities: Activity[]) => void;
  wsToken?: string | null; // T263: WebSocket auth token for real-time updates
  boardId?: string; // T263: Required for WebSocket room subscription
}

export function ActivityFeed({
  type,
  id,
  maxHeight = '600px',
  onActivityUpdate,
  wsToken,
  boardId,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const parentRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  // T263: WebSocket for real-time activity updates
  const ws = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
    token: wsToken || null,
    autoConnect: !!wsToken && !!boardId,
  });

  // Load initial activities
  useEffect(() => {
    loadActivities(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  // T263: Subscribe to real-time activity updates via WebSocket
  useEffect(() => {
    if (!ws.isConnected || !boardId) {
      return;
    }

    // Join board room to receive activity updates
    ws.joinBoard(boardId);

    // Listen for new activity events
    const handleActivityCreated = (data: { activity: Activity }) => {
      const newActivity = {
        ...data.activity,
        createdAt: new Date(data.activity.createdAt), // Parse date
      };

      // Only add if it matches our filter (card or board)
      if (type === 'card' && newActivity.cardId === id) {
        setActivities((prev) => [newActivity, ...prev]);
      } else if (type === 'board' && newActivity.boardId === id) {
        setActivities((prev) => [newActivity, ...prev]);
      }
    };

    ws.on('activity:created', handleActivityCreated);

    return () => {
      ws.off('activity:created', handleActivityCreated);
      ws.leaveBoard(boardId);
    };
  }, [ws, ws.isConnected, boardId, type, id]);

  const loadActivities = async (page: number, isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const apiClient = getActivityApiClient();
      const result =
        type === 'card'
          ? await apiClient.getCardActivity(id, page, PAGE_SIZE)
          : await apiClient.getBoardActivity(id, page, PAGE_SIZE);

      if (isInitial) {
        setActivities(result.data);
      } else {
        setActivities((prev) => [...prev, ...result.data]);
      }

      setCurrentPage(page);
      setHasMore(result.data.length === PAGE_SIZE);

      // Notify parent component
      if (onActivityUpdate) {
        onActivityUpdate(result.data);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activity history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadActivities(currentPage + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isLoadingMore, hasMore]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height per activity item
    overscan: 5, // Number of items to render outside viewport
  });

  // Infinite scroll: detect when user scrolls near bottom
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = parent;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (scrolledToBottom && hasMore && !isLoadingMore) {
        loadMore();
      }
    };

    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMore]);

  // Public method to prepend new activity (for real-time updates)
  const prependActivity = useCallback((activity: Activity) => {
    setActivities((prev) => [activity, ...prev]);
  }, []);

  // Expose method to parent via ref (for real-time updates)
  // This allows parent to call prependActivity when WebSocket events arrive
  useEffect(() => {
    if (onActivityUpdate && parentRef.current) {
      // Store prepend function on DOM element for parent access
      (
        parentRef.current as HTMLDivElement & { prependActivity?: (activity: Activity) => void }
      ).prependActivity = prependActivity;
    }
  }, [prependActivity, onActivityUpdate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => loadActivities(1, true)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">No activity yet</p>
        <p className="text-xs text-gray-400 mt-1">Actions will appear here as they happen</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Activity</h3>

      <div
        ref={parentRef}
        className="overflow-auto border rounded-lg bg-gray-50"
        style={{ maxHeight }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const activity = activities[virtualRow.index];
            return (
              <div
                key={activity.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ActivityItem activity={activity} />
              </div>
            );
          })}
        </div>

        {isLoadingMore && (
          <div className="flex items-center justify-center py-4 border-t">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="ml-2 text-xs text-gray-500">Loading more...</span>
          </div>
        )}

        {!hasMore && activities.length > 0 && (
          <div className="py-3 text-center border-t">
            <p className="text-xs text-gray-400">All activity loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
