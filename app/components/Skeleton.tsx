// ─────────────────────────────────────────────
//  KhetiBahi – Skeleton loaders
//  Shared shimmer primitives + composed skeletons
//  for each page's data-loading state. Swapping the
//  old spinner for these means the page's shape is
//  visible immediately instead of popping in later.
// ─────────────────────────────────────────────

/** A single pulsing block. The building unit for every skeleton below. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-2 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Row of 2-4 stat cards, matching the summary cards used on
 *  Income / Expenses / Loans / Dashboard. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0"
        >
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Filter bar placeholder — the search/select row above most tables. */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-9 w-40 rounded-xl" />
      <Skeleton className="h-9 w-32 rounded-xl" />
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
  );
}

/** A data table with a header bar and N shimmering rows — used by
 *  Income, Expenses, and Loans while their first page of records loads. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-line">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Full Income / Expenses / Loans page skeleton: header, stat cards,
 *  filter bar, table. */
export function ListPageSkeleton({ statCount = 4 }: { statCount?: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <StatCardsSkeleton count={statCount} />
      <FilterBarSkeleton />
      <TableSkeleton />
    </div>
  );
}

/** Small horizontal bars, used for chart placeholders (analytics,
 *  dashboard cash-flow / category breakdown). */
export function ChartSkeleton({ height = "h-56" }: { height?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-line p-5 shadow-soft ${height} flex items-end gap-2`}>
      {[40, 65, 30, 80, 50, 70, 45].map((_, i) => (
        <div key={i} className="flex-1 flex items-end h-full">
          <Skeleton className="w-full rounded-t-md" />
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton: header, stat cards, two charts side by side,
 *  and a "recent activity" list. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <StatCardsSkeleton count={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-line">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Analytics skeleton: header + a couple of panel-shaped blocks that
 *  stand in for the profit/loss list and outstanding-dues panel. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full max-w-md" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Crops page skeleton: header + a grid of crop cards. */
export function CropGridSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-line p-4 shadow-soft space-y-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Budgets / Recurring Expenses skeleton: header, a filter control,
 *  and a stack of item rows/cards. */
export function ListItemsSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-40 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-line p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Crop detail page skeleton (/crops/[crop]): back link, header,
 *  stat cards, and two record lists (sales + expenses). */
export function CropDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
      </div>

      <StatCardsSkeleton count={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-line">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-line">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-4 w-20 flex-shrink-0" />
                  <Skeleton className="h-4 w-16 hidden sm:block" />
                  <Skeleton className="h-4 w-14 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-soft space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}
