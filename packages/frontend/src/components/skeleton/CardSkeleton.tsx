/**
 * CardSkeleton Component
 * Loading placeholder for Card component
 */

export function CardSkeleton() {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 animate-pulse">
      {/* Title skeleton */}
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Description skeleton (optional) */}
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
