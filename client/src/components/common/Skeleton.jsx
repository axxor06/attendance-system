export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5">
      <SkeletonLine className="w-1/3 mb-3" />
      <SkeletonLine className="w-2/3 h-8 mb-2" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white overflow-hidden">
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={`h-${i}`} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 px-4 py-3 border-t border-ink/5"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} />
          ))}
        </div>
      ))}
    </div>
  );
}
