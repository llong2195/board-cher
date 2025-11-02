import { ListSkeleton } from './ListSkeleton';

/**
 * BoardSkeleton Component
 * Loading placeholder for entire Board
 */

interface BoardSkeletonProps {
  listCount?: number;
}

export function BoardSkeleton({ listCount = 4 }: BoardSkeletonProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Board Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Lists Container Skeleton */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full">
          {Array.from({ length: listCount }).map((_, index) => (
            <ListSkeleton key={index} cardCount={Math.floor(Math.random() * 4) + 1} />
          ))}

          {/* Add list button skeleton */}
          <div className="flex-shrink-0 w-72 h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
