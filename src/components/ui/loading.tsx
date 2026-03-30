export function Skeleton({ className = "", dark }: { className?: string; dark?: boolean }) {
  return (
    <div
      className={`animate-pulse ${dark ? "bg-zinc-800" : "bg-bg-surface"} rounded-md ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
