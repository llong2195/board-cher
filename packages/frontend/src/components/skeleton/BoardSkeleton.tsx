import { ListSkeleton } from './ListSkeleton';
import { Skeleton } from '../ui/skeleton';

/**
 * BoardSkeleton Component
 * Loading placeholder for entire Board using shadcn/ui Skeleton
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
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-12" />
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
          <Skeleton className="flex-shrink-0 w-72 h-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
