import { Skeleton } from '../ui/skeleton';

/**
 * CardSkeleton Component
 * Loading placeholder for Card component using shadcn/ui Skeleton
 */

export function CardSkeleton() {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      {/* Title skeleton */}
      <Skeleton className="h-4 w-3/4 mb-2" />

      {/* Description skeleton (optional) */}
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
