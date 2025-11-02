import { CardSkeleton } from './CardSkeleton';

/**
 * ListSkeleton Component
 * Loading placeholder for List component
 */

interface ListSkeletonProps {
  cardCount?: number;
}

export function ListSkeleton({ cardCount = 3 }: ListSkeletonProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3">
      {/* List header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-gray-300 rounded w-32 animate-pulse" />
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>

      {/* Add card button skeleton */}
      <div className="mt-3 h-8 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
