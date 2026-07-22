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

/** A "hero" ledger card — the big net-profit / commitment banner used
 *  at the top of Dashboard, Budgets, and Recurring. */
export function HeroCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-5 flex items-center gap-4 shadow-soft">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

/** A titled panel containing a short list of rows — reused for
 *  Outstanding Dues, Budget/Recurring previews, Breakdown, etc. */
function PanelListSkeleton({ titleWidth = "w-32", rows = 3 }: { titleWidth?: string; rows?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className={`h-4 ${titleWidth}`} />
        <Skeleton className="h-3 w-14" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton — mirrors the real page top to bottom: header,
 *  net-profit hero, 4 stat cards, cash-flow chart, outstanding dues,
 *  budget/recurring preview row, category chart + breakdown, recent
 *  expenses list. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Net profit/loss hero */}
      <HeroCardSkeleton />

      {/* Summary cards */}
      <StatCardsSkeleton count={4} />

      {/* Cash Flow chart */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-44" />
        <ChartSkeleton height="h-40" />
      </div>

      {/* Outstanding Dues */}
      <PanelListSkeleton titleWidth="w-36" rows={3} />

      {/* Budget Progress + Recurring Expenses preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelListSkeleton titleWidth="w-32" rows={2} />
        <PanelListSkeleton titleWidth="w-40" rows={2} />
      </div>

      {/* Category chart + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-40" />
          <ChartSkeleton height="h-48" />
        </div>
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-14" />
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

/** Analytics skeleton — mirrors the real page: P&L by crop, payment
 *  status stacked bar + 3 status cards, outstanding dues, monthly
 *  trend chart, monthly summary + crop-wise spending. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Profit & Loss by Crop */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="space-y-3 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Payment status: stacked bar + 3 cards */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-3 bg-surface-2 space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Outstanding Dues by Buyer */}
      <PanelListSkeleton titleWidth="w-48" rows={3} />

      {/* Monthly trend chart */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
        <Skeleton className="h-4 w-44" />
        <ChartSkeleton height="h-48" />
      </div>

      {/* Monthly Summary + Crop-wise Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft space-y-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-14" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
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

/** Budgets page skeleton — header, month selector, hero commitment
 *  card, and a divided list of budget rows each with a progress bar,
 *  matching the real single-card divide-y layout. */
export function BudgetsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      <HeroCardSkeleton />

      <div className="bg-surface rounded-2xl border border-line shadow-soft divide-y divide-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Recurring Expenses page skeleton — header, hero commitment card,
 *  and a divided list of rows (icon, category/schedule text, amount,
 *  pause + delete action slots) matching the real layout exactly. */
export function RecurringSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <HeroCardSkeleton />

      <div className="bg-surface rounded-2xl border border-line shadow-soft divide-y divide-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-16 flex-shrink-0" />
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
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
/** Profile page skeleton — mirrors the redesigned page: hero identity
 *  card, stat row, quick-links list, account form, and the logout bar. */
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Hero identity card */}
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-soft flex items-center gap-5">
        <Skeleton className="w-[88px] h-[88px] rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Stat row */}
      <StatCardsSkeleton count={4} />

      {/* Quick links */}
      <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account details form */}
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-soft space-y-4">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Logout */}
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}