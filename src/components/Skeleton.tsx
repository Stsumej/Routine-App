export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-hidden="true">
      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function SkeletonStack({ cards = 3 }: { cards?: number }) {
  return (
    <div className="stack" role="status" aria-label="Loading">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} lines={i === 0 ? 2 : 3} />
      ))}
    </div>
  );
}
