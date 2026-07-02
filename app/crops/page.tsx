// ─────────────────────────────────────────────
//  KhetiBahi – Crops Page
//
//  A card per crop the farmer grows. Tapping one
//  drills into /crops/[crop] for the full picture:
//  every sale, every expense, and the profit/loss
//  for just that crop.
// ─────────────────────────────────────────────

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sprout, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useIncome } from "@/app/hooks/useIncome";
import { CROPS } from "@/app/utils/constants";
import { formatNPR, buildCropProfitLoss } from "@/app/utils/helpers";

export default function CropsPage() {
  const { expenses, isLoaded } = useExpenses();
  const { income, isLoaded: incomeLoaded } = useIncome();

  const cropPL = useMemo(() => buildCropProfitLoss(expenses, income), [expenses, income]);
  const displayCrops = CROPS.filter((c) => c.value !== "All Crops");

  if (!isLoaded || !incomeLoaded) {
    return <div className="text-center text-ink-faint py-20">Loading…</div>;
  }

  const hasAnyData = expenses.length > 0 || income.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Crops</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Browse each crop to see its sales, expenses, and profit — all in one place.
        </p>
      </div>

      {!hasAnyData && (
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
          <Sprout className="w-10 h-10 text-brand mx-auto mb-3" />
          <h2 className="font-display font-semibold text-ink mb-1">No crop activity yet</h2>
          <p className="text-sm text-ink-muted">
            Log a sale or an expense against a crop, then come back here to see how it&apos;s doing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayCrops.map((c) => {
          const pl = cropPL.find((p) => p.crop === c.value);
          const income$ = pl?.income ?? 0;
          const expense$ = pl?.expense ?? 0;
          const profit$ = pl?.profit ?? 0;
          const qty = pl?.quantitySoldKg ?? 0;
          const due = pl?.amountDue ?? 0;
          const hasActivity = income$ > 0 || expense$ > 0;
          const isProfit = profit$ >= 0;

          return (
            <Link
              key={c.value}
              href={`/crops/${encodeURIComponent(c.value)}`}
              className="bg-surface rounded-2xl border border-line p-4 shadow-soft hover:border-brand/30 hover:shadow-lift transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl flex-shrink-0 bg-brand-soft">
                    {c.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink truncate">{c.label}</p>
                    {hasActivity ? (
                      <p className="text-xs text-ink-muted tabular-nums truncate">
                        {qty > 0 ? `${qty}kg sold` : "No sales yet"}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-faint">No activity yet</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0 mt-2 group-hover:text-brand transition-colors" />
              </div>

              {hasActivity ? (
                <div className="mt-3 pt-3 border-t border-line space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">Earned</span>
                    <span className="font-semibold text-brand tabular-nums">{formatNPR(income$)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">Spent</span>
                    <span className="font-semibold text-negative tabular-nums">{formatNPR(expense$)}</span>
                  </div>
                  {due > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Due</span>
                      <span className="font-semibold text-accent tabular-nums">{formatNPR(due)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-ink-muted">
                      {isProfit ? "Profit" : "Loss"}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-bold tabular-nums ${isProfit ? "text-brand" : "text-negative"}`}>
                      {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatNPR(Math.abs(profit$))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-line">
                  <p className="text-xs text-ink-faint">Tap to log a sale or expense for {c.label.toLowerCase()}.</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
