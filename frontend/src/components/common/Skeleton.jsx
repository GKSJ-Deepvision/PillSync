export function Skeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div
      className={`${width} ${height} ${className} bg-gray-200 rounded animate-pulse`}
    />
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
          <Skeleton height="h-6" className="mb-3" />
          <Skeleton height="h-4" width="w-3/4" className="mb-2" />
          <Skeleton height="h-4" width="w-1/2" />
        </div>
      ))}
    </div>
  );
}
