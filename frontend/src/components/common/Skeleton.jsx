import './Skeleton.css';

export function Skeleton({ width = '100%', height = '1rem', className = '', style = {} }) {
  return <div className={`skeleton-pulse ${className}`} style={{ width, height, ...style }} />;
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-card-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton height="1.5rem" width="40%" />
          <Skeleton height="1rem" width="75%" />
          <Skeleton height="1rem" width="55%" />
        </div>
      ))}
    </div>
  );
}
