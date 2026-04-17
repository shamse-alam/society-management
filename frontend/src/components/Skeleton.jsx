/** Skeleton shimmer primitives & page-level presets */

function Bone({ className = '' }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

/** Stat card skeleton — matches Dashboard stat cards */
export function StatSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Bone className="h-4 w-24" />
            <Bone className="h-9 w-9 rounded-lg" />
          </div>
          <Bone className="h-7 w-20" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton with header + rows */
export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-card-alt border-b border-border px-5 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-3.5 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Bone key={c} className={`h-3.5 flex-1 ${c === 0 ? 'max-w-[140px]' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card skeleton — generic card placeholder */
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <Bone className="h-5 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** List skeleton — for sidebar lists, menus, etc. */
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dashboard page skeleton — stats + chart area + table */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-6 w-48" />
          <Bone className="h-3.5 w-64" />
        </div>
      </div>
      <StatSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <Bone className="h-5 w-36" />
          <Bone className="h-[200px] w-full rounded-lg" />
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <Bone className="h-5 w-36" />
          <Bone className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
      <TableSkeleton cols={5} rows={5} />
    </div>
  );
}

/** Form page skeleton — for settings, profile edit pages */
export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Bone className="h-6 w-48" />
        <Bone className="h-3.5 w-72" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Bone className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
