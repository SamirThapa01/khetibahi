// ─────────────────────────────────────────────
//  KhetiBahi – TodayEntries
//  Dashboard widget: "what has already been logged today,
//  by anyone in the family, before you add anything new."
//  Merges today's sales + expenses into one timeline, newest first.
// ─────────────────────────────────────────────

"use client";

import { CalendarCheck2, Coins, Wallet, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatNPR } from "@/app/utils/helpers";
import { CATEGORIES, CROPS } from "@/app/utils/constants";
import { todayBS } from "@/app/utils/nepaliDate";
import { useTodayEntries, TodayIncomeEntry, TodayExpenseEntry } from "@/app/hooks/useTodayEntries";

function cropEmoji(crop: string) {
  return CROPS.find((c) => c.value === crop)?.emoji ?? "🌱";
}

function categoryMeta(category: string) {
  return CATEGORIES.find((c) => c.value === category);
}

function timeOf(iso: string) {
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return "";
  }
}

type Row =
  | { kind: "income"; entry: TodayIncomeEntry }
  | { kind: "expense"; entry: TodayExpenseEntry };

interface TodayEntriesProps {
  /** Bump this (e.g. a counter) right after adding a sale/expense elsewhere on the
   *  page to make this widget refetch without needing a full page reload. */
  refreshSignal?: number;
}

export default function TodayEntries({ refreshSignal }: TodayEntriesProps) {
  const { income, expenses, loading, error, refetch } = useTodayEntries(undefined, refreshSignal);

  const rows: Row[] = [
    ...income.map((entry): Row => ({ kind: "income", entry })),
    ...expenses.map((entry): Row => ({ kind: "expense", entry })),
  ].sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime());

  return (
    <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-brand" />
            Today&apos;s Entries
          </h3>
          <p className="text-xs text-ink-faint mt-0.5">BS {todayBS()}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="text-ink-faint hover:text-brand transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      {!error && !loading && rows.length === 0 && (
        <p className="text-sm text-ink-muted">
          No entries recorded today — the first sale or expense you add will show up here for
          everyone at home to see.
        </p>
      )}

      {!error && rows.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {rows.map((row) =>
            row.kind === "income" ? (
              <div
                key={`inc-${row.entry.id}`}
                className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{cropEmoji(row.entry.crop)}</span>
                  <div className="min-w-0">
                    <p className="text-ink font-medium truncate">
                      {row.entry.quantityKg}kg {row.entry.crop} sold to {row.entry.buyer}
                    </p>
                    <p className="text-ink-faint text-xs">
                      {timeOf(row.entry.createdAt)} · ₹{row.entry.ratePerKg}/kg
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 font-semibold text-brand tabular-nums flex-shrink-0 ml-2">
                  <Coins className="w-3 h-3" />
                  {formatNPR(row.entry.quantityKg * row.entry.ratePerKg)}
                </span>
              </div>
            ) : (
              <div
                key={`exp-${row.entry.id}`}
                className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">
                    {categoryMeta(row.entry.category)?.emoji ?? "🧾"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink font-medium truncate">
                      {row.entry.category}
                      {row.entry.crop !== "All Crops" ? ` · ${row.entry.crop}` : ""}
                    </p>
                    <p className="text-ink-faint text-xs">{timeOf(row.entry.createdAt)}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 font-semibold text-negative tabular-nums flex-shrink-0 ml-2">
                  <Wallet className="w-3 h-3" />
                  {formatNPR(row.entry.amount)}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {!error && rows.length > 0 && (
        <p className="text-xs text-ink-faint mt-3">
          {rows.length} {rows.length === 1 ? "entry" : "entries"} logged today — check here before
          adding a new one to avoid recording the same sale or expense twice.
        </p>
      )}
    </div>
  );
}
