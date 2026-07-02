// ─────────────────────────────────────────────
//  KhetiBahi – Analytics Page
//  Profit/loss per crop, monthly spending trend,
//  monthly summary table, and crop-wise spending.
//  This is where the farmer sees the "big
//  picture": not just what went out, but whether
//  each crop actually made money.
// ─────────────────────────────────────────────

"use client";

import { useMemo } from "react";
import { BarChart3, Calendar, TrendingUp, TrendingDown, CheckCircle2, CircleDollarSign, Clock3, Users } from "lucide-react";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useIncome } from "@/app/hooks/useIncome";
import MonthlyTrendChart from "@/app/components/MonthlyTrendChart";
import { CROPS } from "@/app/utils/constants";
import { formatNPR, buildCropProfitLoss, buildPaymentStatusSummary, buildBuyerDues, prettyDate } from "@/app/utils/helpers";
import { CropType } from "@/app/types";

const STATUS_META = {
  Paid:    { label: "Paid",    Icon: CheckCircle2,     text: "text-brand",    bg: "bg-brand-soft",    bar: "bg-brand" },
  Partial: { label: "Partial", Icon: CircleDollarSign, text: "text-accent",   bg: "bg-accent-soft",   bar: "bg-accent" },
  Due:     { label: "Due",     Icon: Clock3,           text: "text-negative", bg: "bg-negative-soft", bar: "bg-negative" },
} as const;

export default function AnalyticsPage() {
  const { expenses, monthlySummaries, isLoaded } = useExpenses();
  const { income, isLoaded: incomeLoaded } = useIncome();

  // Profit/loss per crop: income earned minus expenses spent on that crop.
  // "All Crops" expenses are excluded here on purpose — see buildCropProfitLoss
  // in utils/helpers.ts for why.
  const cropPL = useMemo(() => buildCropProfitLoss(expenses, income), [expenses, income]);

  // Only show crops that actually have *some* activity (income or expense),
  // so the farmer isn't staring at six rows of zeros.
  const activeCropPL = cropPL.filter((c) => c.income > 0 || c.expense > 0);

  // Crop-wise spending totals — computed fresh from the raw expense list
  const cropTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.crop] = (totals[e.crop] ?? 0) + e.amount;
    }
    return Object.entries(totals)
      .map(([crop, total]) => ({
        crop: crop as CropType | "All Crops",
        total,
        emoji: CROPS.find((c) => c.value === crop)?.emoji ?? "🌱",
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const maxCropTotal = cropTotals[0]?.total ?? 1;

  // Payment status breakdown — how much of all-time income is Paid vs Partial vs Due
  const statusSummary = useMemo(() => buildPaymentStatusSummary(income), [income]);
  const totalAllIncome = statusSummary.reduce((sum, s) => sum + s.total, 0) || 1;

  // Who owes what, biggest first
  const buyerDues = useMemo(() => buildBuyerDues(income), [income]);

  if (!isLoaded || !incomeLoaded) {
    return <div className="text-center text-ink-faint py-20">Loading…</div>;
  }

  if (expenses.length === 0 && income.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
        <BarChart3 className="w-10 h-10 text-ink-faint mx-auto mb-3" />
        <h2 className="font-display font-semibold text-ink mb-1">Nothing to analyze yet</h2>
        <p className="text-sm text-ink-muted">
          Add a few expenses and sales first, then come back here for trends and profit/loss.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Analytics</h1>
        <p className="text-sm text-ink-muted">Profit, loss, and spending trends.</p>
      </div>

      {/* Profit / Loss per crop */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
        <h3 className="font-display font-semibold text-ink text-sm mb-1">Profit &amp; Loss by Crop</h3>
        <p className="text-xs text-ink-muted mb-3">
          Income from sales minus expenses tagged to that crop. General farm costs (tagged &quot;All Crops&quot;) aren&apos;t included here — see your overall total on the Dashboard.
        </p>

        {activeCropPL.length === 0 ? (
          <p className="text-sm text-ink-faint text-center py-6">
            No crop-specific income or expenses yet. Log a sale or tag an expense to a crop to see profit/loss here.
          </p>
        ) : (
          <div className="space-y-2">
            {activeCropPL.map((c) => {
              const crop = CROPS.find((cr) => cr.value === c.crop);
              const isProfit = c.profit >= 0;
              return (
                <div
                  key={c.crop}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{crop?.emoji}</span>
                      <span className="text-sm font-medium text-ink">{c.crop}</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                      {formatNPR(c.income)} earned · {formatNPR(c.expense)} spent
                      {c.quantitySoldKg > 0 && ` · ${c.quantitySoldKg}kg sold`}
                      {c.amountDue > 0 && (
                        <span className="text-accent"> · {formatNPR(c.amountDue)} due</span>
                      )}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 flex-shrink-0 font-bold text-sm tabular-nums ${
                    isProfit ? "text-brand" : "text-negative"
                  }`}>
                    {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {formatNPR(Math.abs(c.profit))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment status breakdown */}
      {income.length > 0 && (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ink text-sm mb-1">Payments — Paid vs Partial vs Due</h3>
          <p className="text-xs text-ink-muted mb-3">
            How much of everything you&apos;ve earned has actually landed in your hands.
          </p>

          {/* Stacked bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-2">
            {statusSummary.map((s) => {
              const pct = (s.total / totalAllIncome) * 100;
              if (pct <= 0) return null;
              return <div key={s.status} className={STATUS_META[s.status].bar} style={{ width: `${pct}%` }} />;
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {statusSummary.map((s) => {
              const meta = STATUS_META[s.status];
              const Icon = meta.Icon;
              return (
                <div key={s.status} className={`rounded-xl p-3 ${meta.bg}`}>
                  <p className={`flex items-center gap-1 text-[11px] font-semibold ${meta.text}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </p>
                  <p className="text-sm font-display font-bold text-ink tabular-nums mt-1 truncate">
                    {formatNPR(s.total)}
                  </p>
                  <p className="text-[11px] text-ink-muted tabular-nums">
                    {s.count} sale{s.count === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outstanding dues by buyer */}
      {buyerDues.length > 0 && (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ink text-sm mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-ink-faint" />
            Outstanding Dues by Buyer
          </h3>
          <p className="text-xs text-ink-muted mb-3">
            Who still owes you money, biggest amount first.
          </p>
          <div className="space-y-2">
            {buyerDues.map((b) => {
              const crop = CROPS.find((c) => c.value === b.crop);
              return (
                <div
                  key={`${b.buyer}-${b.crop}`}
                  className="flex items-center justify-between gap-3 py-2 border-b border-line last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {crop?.emoji} {b.buyer}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {b.crop} · {b.saleCount} sale{b.saleCount === 1 ? "" : "s"} · since {prettyDate(b.oldestDueDate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-negative tabular-nums flex-shrink-0">
                    {formatNPR(b.totalDue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly trend chart */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
        <h3 className="font-display font-semibold text-ink text-sm mb-2">Monthly Spending Trend</h3>
        <MonthlyTrendChart summaries={monthlySummaries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly summary table */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ink text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ink-faint" />
            Monthly Summary
          </h3>
          {monthlySummaries.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-6">No expenses logged yet.</p>
          ) : (
            <div className="space-y-1">
              {monthlySummaries.map((m) => (
                <div
                  key={m.month}
                  className="flex items-center justify-between py-2 border-b border-line last:border-0"
                >
                  <span className="text-sm text-ink-muted">{m.month}</span>
                  <span className="text-sm font-bold text-ink tabular-nums">{formatNPR(m.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crop-wise spending breakdown */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ink text-sm mb-3">Crop-wise Spending</h3>
          {cropTotals.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-6">No expenses logged yet.</p>
          ) : (
            <div className="space-y-3">
              {cropTotals.map((c) => (
                <div key={c.crop}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink-muted">
                      {c.emoji} {c.crop}
                    </span>
                    <span className="font-semibold text-ink tabular-nums">{formatNPR(c.total)}</span>
                  </div>
                  {/* Progress bar relative to the highest-spending crop */}
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${(c.total / maxCropTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
