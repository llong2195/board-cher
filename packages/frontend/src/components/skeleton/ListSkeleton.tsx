import { CardSkeleton } from './CardSkeleton';
import { Skeleton } from '../ui/skeleton';

/**
 * ListSkeleton Component
 * Loading placeholder for List component using shadcn/ui Skeleton
 */

interface ListSkeletonProps {
  cardCount?: number;
}

export function ListSkeleton({ cardCount = 3 }: ListSkeletonProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3">
      {/* List header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>

      {/* Add card button skeleton */}
      <Skeleton className="mt-3 h-8 w-full" />
    </div>
  );
}
