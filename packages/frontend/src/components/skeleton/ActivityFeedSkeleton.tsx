import { Skeleton } from '../ui/skeleton';

/**
 * ActivityFeedSkeleton Component
 * Loading placeholder for ActivityFeed component using shadcn/ui Skeleton
 */

interface ActivityFeedSkeletonProps {
  itemCount?: number;
}

export function ActivityFeedSkeleton({ itemCount = 5 }: ActivityFeedSkeletonProps) {
  return (
    <div className="space-y-4 py-4">
      {Array.from({ length: itemCount }).map((_, index) => (
        <ActivityItemSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * ActivityItemSkeleton Component
 * Loading placeholder for a single activity item
 */

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-b-0">
      {/* User avatar skeleton */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

      {/* Activity content */}
      <div className="flex-1 space-y-2">
        {/* Activity description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Timestamp */}
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
