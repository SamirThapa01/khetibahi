// ─────────────────────────────────────────────
//  KhetiBahi – Dashboard (Home Page)
//  The first thing the farmer sees:
//  totals, cash flow trend, category breakdown
//  chart, recent expenses, and a quick-add button.
// ─────────────────────────────────────────────

"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet, TrendingUp, Receipt, Sprout, Coins, TrendingDown, Users, Clock3 } from "lucide-react";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useIncome } from "@/app/hooks/useIncome";
import SummaryCard from "@/app/components/SummaryCard";
import ExpenseForm from "@/app/components/ExpenseForm";
import ExpenseRow from "@/app/components/ExpenseRow";
import CategoryChart from "@/app/components/CategoryChart";
import CashFlowChart from "@/app/components/CashFlowChart";
import { formatNPR, buildCashFlowSummaries, buildBuyerDues } from "@/app/utils/helpers";
import { ExpenseFormData } from "@/app/types";
import { format } from "date-fns";

export default function DashboardPage() {
  const {
    expenses,
    categorySummaries,
    totalSpend,
    isLoaded,
    addExpense,
  } = useExpenses();

  const { income, totalIncome, isLoaded: incomeLoaded } = useIncome();

  const [showForm, setShowForm] = useState(false);

  // This month's total (for the "this month" stat card)
  const thisMonthKey = format(new Date(), "yyyy-MM");
  const thisMonthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  // Net profit/loss across the whole farm: everything earned minus everything spent
  const netProfit = totalIncome - totalSpend;
  const hasAnyData = expenses.length > 0 || income.length > 0;

  // Last 6 months of income vs. expense, for the new cash flow chart
  const cashFlow = useMemo(() => buildCashFlowSummaries(expenses, income, 6), [expenses, income]);

  // Who still owes money — top 5 by amount due, for a quick glance without
  // needing to go to /analytics. Uses the same buildBuyerDues() that
  // already powers the Analytics "Outstanding Dues" section.
  const buyerDues = useMemo(() => buildBuyerDues(income), [income]);
  const topDues = buyerDues.slice(0, 5);
  const totalDue = buyerDues.reduce((sum, d) => sum + d.totalDue, 0);

  // 5 most recent expenses
  const recent = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  function handleAdd(data: ExpenseFormData) {
    addExpense(data);
    setShowForm(false);
  }

  if (!isLoaded || !incomeLoaded) {
    return <div className="text-center text-ink-faint py-20">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">Your farm&apos;s money, at a glance.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/income"
            className="flex items-center gap-2 border border-line text-brand text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-soft transition-colors"
          >
            <Coins className="w-4 h-4" />
            <span className="hidden sm:inline">Log Sale</span>
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyData && (
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
          <Sprout className="w-10 h-10 text-brand mx-auto mb-3" />
          <h2 className="font-display font-semibold text-ink mb-1">No expenses yet</h2>
          <p className="text-sm text-ink-muted mb-4">
            Start tracking your pesticide, seed, and labor costs — add your first expense.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Expense
          </button>
        </div>
      )}

      {hasAnyData && (
        <>
          {/* Net profit/loss hero card */}
          <div
            className={`bahi-ledger rounded-2xl border p-5 flex items-center gap-4 shadow-soft ${
              netProfit >= 0
                ? "bg-brand-soft border-brand/20"
                : "bg-negative-soft border-negative/20"
            }`}
          >
            <div className={`p-3 rounded-xl flex-shrink-0 ${netProfit >= 0 ? "bg-brand text-white" : "bg-negative text-white"}`}>
              {netProfit >= 0 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${netProfit >= 0 ? "text-brand-dark" : "text-negative"}`}>
                {netProfit >= 0 ? "Net Profit" : "Net Loss"} (All Time)
              </p>
              <p className="text-2xl font-display font-bold text-ink tabular-nums">
                {formatNPR(Math.abs(netProfit))}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                {formatNPR(totalIncome)} earned − {formatNPR(totalSpend)} spent
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              label="Total Income"
              value={formatNPR(totalIncome)}
              sub={`Across ${income.length} sales`}
              Icon={Coins}
              iconBg="bg-brand-soft"
              iconText="text-brand"
            />
            <SummaryCard
              label="Total Spent"
              value={formatNPR(totalSpend)}
              sub={`Across ${expenses.length} entries`}
              Icon={Wallet}
              iconBg="bg-negative-soft"
              iconText="text-negative"
            />
            <SummaryCard
              label="This Month's Spend"
              value={formatNPR(thisMonthTotal)}
              sub={format(new Date(), "MMMM yyyy")}
              Icon={Receipt}
              iconBg="bg-accent-soft"
              iconText="text-accent"
            />
          </div>

          {/* Cash flow trend — new: income vs. expense over the last 6 months */}
          <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
            <h3 className="font-display font-semibold text-ink text-sm mb-1">Cash Flow</h3>
            <p className="text-xs text-ink-muted mb-2">Income vs. expense, last 6 months.</p>
            <CashFlowChart data={cashFlow} />
          </div>

          {/* Outstanding dues — quick glance, full detail lives on /analytics */}
          {topDues.length > 0 && (
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-negative" />
                  Outstanding Dues
                </h3>
                <span className="text-sm font-semibold text-negative tabular-nums">
                  {formatNPR(totalDue)}
                </span>
              </div>
              <div className="space-y-2">
                {topDues.map((d) => (
                  <div
                    key={`${d.buyer}-${d.crop}`}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0"
                  >
                    <div>
                      <p className="text-ink font-medium">{d.buyer}</p>
                      <p className="text-ink-faint text-xs flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {d.crop} · since {d.oldestDueDate}
                      </p>
                    </div>
                    <span className="font-semibold text-negative tabular-nums">
                      {formatNPR(d.totalDue)}
                    </span>
                  </div>
                ))}
              </div>
              {buyerDues.length > 5 && (
                <a href="/analytics" className="text-xs text-brand font-medium hover:underline mt-3 inline-block">
                  View all {buyerDues.length} →
                </a>
              )}
            </div>
          )}

          {/* Chart + recent expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Category chart */}
            <div className="lg:col-span-2 bg-surface rounded-2xl border border-line p-5 shadow-soft">
              <h3 className="font-display font-semibold text-ink text-sm mb-2">Spending by Category</h3>
              <CategoryChart summaries={categorySummaries} />
            </div>

            {/* Category list */}
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-soft">
              <h3 className="font-display font-semibold text-ink text-sm mb-3">Breakdown</h3>
              <div className="space-y-2">
                {categorySummaries
                  .filter((s) => s.total > 0)
                  .map((s) => (
                    <div key={s.category} className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">{s.category}</span>
                      <span className="font-semibold text-ink tabular-nums">{formatNPR(s.total)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent expenses */}
          <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink text-sm">Recent Expenses</h3>
              <a href="/expenses" className="text-xs text-brand font-medium hover:underline">
                View all →
              </a>
            </div>
            <div>
              {recent.map((exp) => (
                <ExpenseRow
                  key={exp.id}
                  expense={exp}
                  onEdit={() => (window.location.href = "/expenses")}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add expense modal */}
      {showForm && <ExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />}
    </div>
  );
}