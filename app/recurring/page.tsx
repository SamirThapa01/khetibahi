"use client";

import { useState } from "react";
import { Repeat, Plus, Trash2, Pause, Play } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRecurringExpenses } from "@/app/hooks/useRecurringExpenses";
import RecurringExpenseForm, { RecurringExpenseSubmitData } from "@/app/components/RecurringExpenseForm";
import ConfirmDeleteModal from "@/app/components/Confirmdeletemodal";
import { CATEGORIES } from "@/app/utils/constants";
import { formatNPR } from "@/app/utils/helpers";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeSchedule(item: { frequency: "weekly" | "monthly"; dayOfMonth?: number; dayOfWeek?: number }) {
  if (item.frequency === "monthly") {
    return `Monthly on day ${item.dayOfMonth}`;
  }
  return `Weekly on ${WEEKDAYS[item.dayOfWeek ?? 0]}`;
}

export default function RecurringPage() {
  const { items, loading, addRecurring, toggleActive, deleteRecurring } = useRecurringExpenses();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeItems = items.filter((i) => i.active);
  const monthlyCommitment = activeItems.reduce((sum, i) => {
    return sum + (i.frequency === "weekly" ? i.amount * 4.33 : i.amount);
  }, 0);

  async function handleAdd(data: RecurringExpenseSubmitData) {
    await addRecurring(data);
    setShowForm(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecurring(deleteTarget);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function categoryMeta(category: string) {
    return CATEGORIES.find((c) => c.value === category);
  }

  if (loading) {
    return <div className="text-center text-ink-faint py-20">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Recurring Expenses</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Standing costs like weekly wages or monthly irrigation — logged automatically when due.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Recurring
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
          <Repeat className="w-10 h-10 text-brand mx-auto mb-3" />
          <h2 className="font-display font-semibold text-ink mb-1">No recurring expenses yet</h2>
          <p className="text-sm text-ink-muted mb-4">
            Set up a rule for costs that repeat, like weekly labor or monthly irrigation fees.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Recurring Expense
          </button>
        </div>
      ) : (
        <>
          <div className="bahi-ledger rounded-2xl border border-line p-5 flex items-center gap-4 shadow-soft">
            <div className="p-3 rounded-xl flex-shrink-0 bg-brand text-white">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Est. Monthly Commitment
              </p>
              <p className="text-2xl font-display font-bold text-ink tabular-nums">
                {formatNPR(Math.round(monthlyCommitment))}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                Across {activeItems.length} active rule{activeItems.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-line shadow-soft divide-y divide-line">
            {items.map((item) => {
              const meta = categoryMeta(item.category);
              return (
                <div key={item._id} className="p-4 flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg flex-shrink-0 ${
                      meta?.bg ?? "bg-surface-2"
                    }`}
                  >
                    {meta?.emoji ?? "💰"}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink truncate">
                        {item.category}
                        {item.crop !== "All Crops" ? ` · ${item.crop}` : ""}
                      </p>
                      {!item.active && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint bg-surface-2 px-1.5 py-0.5 rounded">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted truncate">
                      {describeSchedule(item)}
                      {item.note ? ` · ${item.note}` : ""}
                    </p>
                    {item.lastGeneratedDate && (
                      <p className="text-[11px] text-ink-faint mt-0.5">
                        Last logged {format(parseISO(item.lastGeneratedDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  <span className="font-semibold text-ink tabular-nums flex-shrink-0">
                    {formatNPR(item.amount)}
                  </span>

                  <button
                    onClick={() => toggleActive(item._id, !item.active)}
                    className="p-2 rounded-lg text-ink-faint hover:bg-surface-2 hover:text-ink transition-colors flex-shrink-0"
                    aria-label={item.active ? "Pause" : "Resume"}
                    title={item.active ? "Pause" : "Resume"}
                  >
                    {item.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setDeleteTarget(item._id)}
                    className="p-2 rounded-lg text-ink-faint hover:bg-negative-soft hover:text-negative transition-colors flex-shrink-0"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showForm && <RecurringExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete recurring expense?"
        description="This stops future auto-generated expenses from this rule. Past expenses already logged are not affected."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}