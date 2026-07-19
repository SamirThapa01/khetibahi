// ─────────────────────────────────────────────
//  KhetiBahi – IncomeFilterBar
//  Search + crop/month filters for the income list.
// ─────────────────────────────────────────────

"use client";

import { Search, X } from "lucide-react";
import { IncomeFilters } from "@/app/hooks/useIncome";
import { useCrops } from "@/app/hooks/useCrops";
import { format, subMonths } from "date-fns";

interface IncomeFilterBarProps {
  filters: IncomeFilters;
  onFilter: <K extends keyof IncomeFilters>(key: K, value: IncomeFilters[K]) => void;
  onReset: () => void;
}

function monthOptions() {
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    months.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  return months;
}

export default function IncomeFilterBar({ filters, onFilter, onReset }: IncomeFilterBarProps) {
  const { crops } = useCrops();
  const hasActiveFilters =
    filters.crop !== "All" || filters.month !== "" || filters.search !== "" || filters.status !== "All";

  return (
    <div className="bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-soft">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          type="text"
          placeholder="Search by buyer, crop, or note…"
          value={filters.search}
          onChange={(e) => onFilter("search", e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-line bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.crop}
          onChange={(e) => onFilter("crop", e.target.value as IncomeFilters["crop"])}
          className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Crops</option>
          {crops.filter((c) => c.value !== "All Crops").map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFilter("status", e.target.value as IncomeFilters["status"])}
          className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Payments</option>
          <option value="Paid">✅ Paid</option>
          <option value="Partial">🟠 Partial</option>
          <option value="Due">⏳ Due</option>
        </select>

        <select
          value={filters.month}
          onChange={(e) => onFilter("month", e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All Time</option>
          {monthOptions().map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-negative rounded-xl border border-negative/25 hover:bg-negative-soft transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
