// ─────────────────────────────────────────────
//  KhetiBahi – FilterBar
//  The search + filter controls above the list.
// ─────────────────────────────────────────────

"use client";

import { Search, X } from "lucide-react";
import { ExpenseFilters } from "@/app/hooks/useExpenses";
import { CATEGORIES, CROPS } from "@/app/utils/constants";
import { format, subMonths } from "date-fns";

interface FilterBarProps {
  filters: ExpenseFilters;
  onFilter: <K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => void;
  onReset: () => void;
}

/** Last 12 months as "YYYY-MM" options */
function monthOptions() {
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    months.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  return months;
}

export default function FilterBar({ filters, onFilter, onReset }: FilterBarProps) {
  const hasActiveFilters =
    filters.category !== "All" ||
    filters.crop !== "All" ||
    filters.month !== "" ||
    filters.search !== "";

  return (
    <div className="bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-soft">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          type="text"
          placeholder="Search by note, category, or crop…"
          value={filters.search}
          onChange={(e) => onFilter("search", e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-line bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2">
        {/* Category filter */}
        <select
          value={filters.category}
          onChange={(e) => onFilter("category", e.target.value as ExpenseFilters["category"])}
          className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        {/* Crop filter */}
        <select
          value={filters.crop}
          onChange={(e) => onFilter("crop", e.target.value as ExpenseFilters["crop"])}
          className="flex-1 min-w-[120px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Crops</option>
          {CROPS.filter((c) => c.value !== "All Crops").map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        {/* Month filter */}
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

        {/* Reset */}
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
