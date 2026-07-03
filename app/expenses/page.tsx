// ─────────────────────────────────────────────
//  KhetiBahi – Expenses Page  (redesigned)
//
//  Layout (desktop):
//    Header + Add button
//    ├─ 4 category stat cards
//    └─ two columns:
//         left  (flex-1) → FilterBar + table
//         right (fixed)  → Distribution donut
//
//  Table rows: CATEGORY | RELATED CROP | DATE | AMOUNT | actions
//  This is a proper <table> so all columns align.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Inbox, Pencil, Trash2 } from "lucide-react";
import { useExpenses } from "@/app/hooks/useExpenses";
import ExpenseForm from "@/app/components/ExpenseForm";
import FilterBar from "@/app/components/FilterBar";
import DistributionChart from "@/app/components/DistributionChart";
import { Expense, ExpenseFormData } from "@/app/types";
import { exportToCSV, grandTotal, formatNPR } from "@/app/utils/helpers";
import { CATEGORIES } from "@/app/utils/constants";

// Icon badge shown inside category stat cards
const CATEGORY_ICONS: Record<string, { bg: string; icon: string }> = {
  Seeds:         { bg: "#e8f5e9", icon: "🌱" },
  Fertilizer:    { bg: "#e3f2fd", icon: "🌿" },
  Labor:         { bg: "#fce4ec", icon: "👷" },
  Transport:     { bg: "#fff3e0", icon: "🚛" },
  Pesticide:     { bg: "#f3e5f5", icon: "🧪" },
  Irrigation:    { bg: "#e0f7fa", icon: "💧" },
  Equipment:     { bg: "#ede7f6", icon: "⚙️"  },
  Miscellaneous: { bg: "#f5f5f5", icon: "📦" },
};

export default function ExpensesPage() {
  const {
    expenses,
    filteredExpenses,
    categorySummaries,
    totalSpend,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    filters,
    setFilter,
    resetFilters,
  } = useExpenses();

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Expense | null>(null);

  // 🔒 Lock background scroll while the modal is open.
  // Runs every time `showForm` flips true/false.
  useEffect(() => {
    if (!showForm) return; // modal closed → do nothing, no lock needed

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    // Cleanup: runs when showForm becomes false, OR when the
    // component unmounts. This undoes the lock and restores scroll.
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [showForm]);

  function handleSubmit(data: ExpenseFormData) {
    if (editing) updateExpense(editing.id, data);
    else         addExpense(data);
    setShowForm(false);
    setEditing(null);
  }

  function handleEdit(exp: Expense) {
    setEditing(exp);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: string, label: string) {
    if (confirm(`Delete this ${label} expense?`)) deleteExpense(id);
  }

  const sorted = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const filteredTotal = grandTotal(filteredExpenses);

  // Top 4 categories by total spend — for the stat cards
  const topCategories = [...categorySummaries]
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`space-y-5 ${showForm ? "pointer-events-none select-none" : ""}`}
        aria-hidden={showForm}
      >
        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Expenses</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Monitor spending across{" "}
              {topCategories.map((c, i) => (
                <span key={c.category}>
                  <span className="text-brand">{c.category.toLowerCase()}</span>
                  {i < topCategories.length - 1 ? (i === topCategories.length - 2 ? ", and " : ", ") : "."}
                </span>
              ))}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => exportToCSV(sorted)}
              disabled={sorted.length === 0}
              className="flex items-center gap-2 border border-line text-ink-muted text-sm font-medium px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-soft transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* ── Category stat cards ── */}
        {topCategories.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topCategories.map((s) => {
              const meta = CATEGORY_ICONS[s.category] ?? { bg: "#f5f5f5", icon: "📦" };
              const cat  = CATEGORIES.find((c) => c.value === s.category);
              return (
                <div
                  key={s.category}
                  className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3"
                >
                  <span
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0"
                    style={{ background: meta.bg }}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: cat?.chart ?? "#6b7280" }}
                    >
                      {s.category}
                    </p>
                    <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                      {formatNPR(s.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main content: table (left) + donut (right) ── */}
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Left: filter bar + table */}
          <div className="flex-1 min-w-0 space-y-3">
            <FilterBar filters={filters} onFilter={setFilter} onReset={resetFilters} />

            <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
                <h2 className="font-display font-semibold text-ink text-sm">
                  Expense Records
                </h2>
                <span className="text-xs text-ink-muted tabular-nums">
                  {filteredExpenses.length} entries · {formatNPR(filteredTotal)}
                </span>
              </div>

              {sorted.length === 0 ? (
                <div className="text-center py-14">
                  <Inbox className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                  <p className="text-sm text-ink-muted">No expenses match your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-5 py-2.5">
                          Category
                        </th>
                        <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5">
                          Related Crop
                        </th>
                        <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5">
                          Date
                        </th>
                        <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-5 py-2.5">
                          Amount
                        </th>
                        <th className="w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((exp) => {
                        const cat = CATEGORIES.find((c) => c.value === exp.category);
                        return (
                          <tr
                            key={exp.id}
                            className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors group"
                          >
                            {/* Category badge */}
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cat?.bg ?? "bg-gray-100"} ${cat?.text ?? "text-gray-700"}`}
                              >
                                {exp.category}
                              </span>
                            </td>

                            {/* Crop */}
                            <td className="px-4 py-3 text-brand font-medium">
                              {exp.crop === "All Crops" ? (
                                <span className="text-ink-muted">—</span>
                              ) : (
                                exp.crop
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-ink-muted tabular-nums">
                              {exp.date}
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-3 text-right font-semibold text-negative tabular-nums">
                              −{formatNPR(exp.amount)}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(exp)}
                                  className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-brand-soft transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(exp.id, exp.category)}
                                  className="p-1.5 rounded-lg text-ink-faint hover:text-negative hover:bg-negative-soft transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: distribution donut */}
          {expenses.length > 0 && (
            <div className="w-full xl:w-72 flex-shrink-0">
              <div className="bg-surface rounded-2xl border border-line shadow-soft p-5 sticky top-20">
                <h2 className="font-display font-semibold text-ink text-sm mb-4">
                  Distribution
                </h2>
                <DistributionChart summaries={categorySummaries} total={totalSpend} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal — lives OUTSIDE the pointer-events-none wrapper,
          so it stays fully clickable/scrollable/draggable even
          while everything behind it is frozen. */}
      {showForm && (
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={
            editing
              ? {
                  date: editing.date,
                  category: editing.category,
                  crop: editing.crop,
                  amount: editing.amount,
                  note: editing.note,
                  billImage: editing.billImage,
                }
              : undefined
          }
        />
      )}
    </>
  );
}