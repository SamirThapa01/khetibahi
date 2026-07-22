"use client";

import { useState, useMemo } from "react";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useBudgets } from "@/app/hooks/useBudgets";
import BudgetForm from "@/app/components/BudgetForm";
import ConfirmDeleteModal from "@/app/components/Confirmdeletemodal";
import { formatNPR } from "@/app/utils/helpers";
import { ListItemsSkeleton } from "@/app/components/Skeleton";

export default function BudgetsPage() {
  const { expenses, isLoaded } = useExpenses();
  const { budgets, loading, setBudget, deleteBudget } = useBudgets(expenses);

  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const months = useMemo(() => {
    const set = new Set(budgets.map((b) => b.month));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [budgets, currentMonth]);

  const monthBudgets = budgets.filter((b) => b.month === selectedMonth);
  const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = monthBudgets.reduce((sum, b) => sum + b.spent, 0);

  async function handleSetBudget(category: string, crop: string, month: string, amount: number) {
    await setBudget(category, crop, month, amount);
    setSelectedMonth(month);
    setShowForm(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBudget(deleteTarget);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!isLoaded || loading) {
    return <ListItemsSkeleton items={3} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Budgets</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Set spending limits by category or crop, and watch them fill up as you spend.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors"
        >
          <Plus className="w-4 h-4" />
          Set Budget
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-ink-muted">Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {format(parseISO(`${m}-01`), "MMMM yyyy")}
            </option>
          ))}
        </select>
      </div>

      {monthBudgets.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
          <PiggyBank className="w-10 h-10 text-brand mx-auto mb-3" />
          <h2 className="font-display font-semibold text-ink mb-1">
            No budgets for {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")}
          </h2>
          <p className="text-sm text-ink-muted mb-4">
            Set a spending limit for a category or crop to start tracking against it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Set First Budget
          </button>
        </div>
      ) : (
        <>
          <div className="bahi-ledger rounded-2xl border border-line p-5 flex items-center gap-4 shadow-soft">
            <div
              className={`p-3 rounded-xl flex-shrink-0 ${
                totalSpent > totalBudgeted ? "bg-negative text-white" : "bg-brand text-white"
              }`}
            >
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")} Budget
              </p>
              <p className="text-2xl font-display font-bold text-ink tabular-nums">
                {formatNPR(totalSpent)}{" "}
                <span className="text-ink-faint text-base font-normal">/ {formatNPR(totalBudgeted)}</span>
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-line shadow-soft divide-y divide-line">
            {monthBudgets.map((b) => (
              <div key={b._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-ink">
                        {b.category}
                        {b.crop !== "All" ? ` · ${b.crop}` : ""}
                      </span>
                      <span className={b.isOverBudget ? "text-negative font-semibold" : "text-ink-muted"}>
                        {formatNPR(b.spent)} / {formatNPR(b.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          b.isOverBudget ? "bg-negative" : b.percentUsed > 80 ? "bg-accent" : "bg-brand"
                        }`}
                        style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                      />
                    </div>
                    {b.isOverBudget && (
                      <p className="text-xs text-negative mt-1">Over by {formatNPR(Math.abs(b.remaining))}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteTarget(b._id)}
                    className="p-2 rounded-lg text-ink-faint hover:bg-negative-soft hover:text-negative transition-colors flex-shrink-0"
                    aria-label="Delete budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <BudgetForm defaultMonth={selectedMonth} onSubmit={handleSetBudget} onCancel={() => setShowForm(false)} />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete budget?"
        description="This removes the budget limit. Your expense history is not affected."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}