// ─────────────────────────────────────────────
//  KhetiBahi – LoanFilterBar
//  Search + source/status/month filters for the udhaar list.
//  Mirrors IncomeFilterBar.
// ─────────────────────────────────────────────

"use client";

import { Search, X } from "lucide-react";
import { LoanFilters } from "@/app/hooks/useLoans";
import { LOAN_SOURCES } from "@/app/utils/constants";
import { format, subMonths } from "date-fns";

interface LoanFilterBarProps {
  filters: LoanFilters;
  onFilter: <K extends keyof LoanFilters>(key: K, value: LoanFilters[K]) => void;
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

export default function LoanFilterBar({ filters, onFilter, onReset }: LoanFilterBarProps) {
  const hasActiveFilters =
    filters.source !== "All" || filters.month !== "" || filters.search !== "" || filters.status !== "All";

  return (
    <div className="bg-surface rounded-2xl border border-line p-4 space-y-3 shadow-soft">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          type="text"
          placeholder="Search by lender or note…"
          value={filters.search}
          onChange={(e) => onFilter("search", e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-line bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.source}
          onChange={(e) => onFilter("source", e.target.value as LoanFilters["source"])}
          className="flex-1 min-w-[150px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Sources</option>
          {LOAN_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFilter("status", e.target.value as LoanFilters["status"])}
          className="flex-1 min-w-[130px] px-3 py-1.5 text-sm rounded-xl border border-line bg-surface text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="All">All Repayments</option>
          <option value="Paid">✅ Repaid</option>
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
