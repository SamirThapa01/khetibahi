// ─────────────────────────────────────────────
//  KhetiBahi – Income Page (redesigned)
//  Same visual language as Expenses page:
//  stat cards at top, clean table, right-side panel.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Download,
  Inbox,
  Pencil,
  Trash2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Wallet,
} from "lucide-react";
import { useIncome } from "@/app/hooks/useIncome";
import IncomeForm from "@/app/components/IncomeForm";
import IncomeFilterBar from "@/app/components/IncomeFilterBar";
import RecordPaymentModal from "@/app/components/RecordPaymentModal";
import ConfirmDeleteModal from "../components/Confirmdeletemodal";
import { Income, IncomeFormData } from "@/app/types";
import { exportIncomeToCSV, grandIncomeTotal, formatNPR, getPaymentStatus, amountDueFor } from "@/app/utils/helpers";
import { CROPS } from "@/app/utils/constants";

// Visual language for each payment status — reused across the badge and the stat card
const STATUS_META = {
  Paid:    { label: "Paid",    Icon: CheckCircle2,    text: "text-brand",    bg: "bg-brand-soft" },
  Partial: { label: "Partial", Icon: CircleDollarSign, text: "text-accent",   bg: "bg-accent-soft" },
  Due:     { label: "Due",     Icon: Clock3,          text: "text-negative", bg: "bg-negative-soft" },
} as const;

export default function IncomePage() {
  const {
    income,
    filteredIncome,
    totalIncome,
    totalDue,
    statusSummary,
    isLoaded,
    addIncome,
    updateIncome,
    deleteIncome,
    recordPayment,
    filters,
    setFilter,
    resetFilters,
  } = useIncome();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Income | null>(null);
  const [paying, setPaying]       = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; crop: string; buyer: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Is ANY modal open? The add/edit form, the payment modal, or the delete confirm modal.
  const isAnyModalOpen = showForm || paying !== null || incomeToDelete !== null;

  // 🔒 Lock background scroll while a modal is open — same logic
  // as the Expenses page, just inlined here (no shared hook file).
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isAnyModalOpen]);

  function handleSubmit(data: IncomeFormData) {
    if (editing) updateIncome(editing.id, data);
    else         addIncome(data);
    setShowForm(false);
    setEditing(null);
  }

  function handleEdit(inc: Income) {
    setEditing(inc);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
  }

  // Opens the confirm modal instead of deleting right away
  function handleDelete(id: string, crop: string, buyer: string) {
    setIncomeToDelete({ id, crop, buyer });
  }

  // Runs only when the user confirms inside the modal
  async function handleConfirmDelete() {
    if (!incomeToDelete) return;
    setIsDeleting(true);
    try {
      deleteIncome(incomeToDelete.id);
    } finally {
      setIsDeleting(false);
      setIncomeToDelete(null);
    }
  }

  function handleConfirmPayment(extraPaid: number) {
    if (paying) recordPayment(paying.id, extraPaid);
    setPaying(null);
  }

  const sorted = [...filteredIncome].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const filteredTotal = grandIncomeTotal(filteredIncome);
  const totalPaid = income.reduce((s, i) => s + i.amountPaid, 0);
  const pendingCount = statusSummary
    .filter((s) => s.status !== "Paid")
    .reduce((sum, s) => sum + s.count, 0);

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
        className={`space-y-5 ${isAnyModalOpen ? "pointer-events-none select-none" : ""}`}
        aria-hidden={isAnyModalOpen}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">Income</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Track crop sales — quantity, rate, and payments received.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => exportIncomeToCSV(sorted)}
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
              <span>Log Sale</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        {income.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-brand-soft">
                💰
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-brand mb-0.5">Total Income</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalIncome)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-[#e8f5e9]">
                ✅
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#2e7d32] mb-0.5">Amount Paid</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalPaid)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-accent-soft">
                ⏳
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-accent mb-0.5">Amount Due</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalDue)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-negative-soft">
                <Wallet className="w-5 h-5 text-negative" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-negative mb-0.5">Pending Sales</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter + table ── */}
        <IncomeFilterBar filters={filters} onFilter={setFilter} onReset={resetFilters} />

        <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line gap-3">
            <h2 className="font-display font-semibold text-ink text-sm flex-shrink-0">Sales Records</h2>
            <span className="text-xs text-ink-muted tabular-nums text-right truncate">
              {filteredIncome.length} sales · {formatNPR(filteredTotal)}
            </span>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-14">
              <Inbox className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-muted">No sales match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-5 py-2.5">Crop</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5">Buyer</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5 hidden sm:table-cell">Qty × Rate</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5 hidden md:table-cell">Date</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-4 py-2.5">Payment</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-faint px-5 py-2.5">Amount</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((inc) => {
                    const crop = CROPS.find((c) => c.value === inc.crop);
                    const total = inc.quantityKg * inc.ratePerKg;
                    const due = amountDueFor(inc);
                    const status = getPaymentStatus(inc);
                    const meta = STATUS_META[status];
                    const StatusIcon = meta.Icon;

                    return (
                      <tr
                        key={inc.id}
                        className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors group"
                      >
                        {/* Crop */}
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-soft text-brand whitespace-nowrap">
                            {crop?.emoji} {inc.crop}
                          </span>
                        </td>

                        {/* Buyer */}
                        <td className="px-4 py-3 font-medium text-ink max-w-[140px] truncate" title={inc.buyer}>
                          {inc.buyer}
                        </td>

                        {/* Qty × Rate */}
                        <td className="px-4 py-3 text-ink-muted tabular-nums hidden sm:table-cell whitespace-nowrap">
                          {inc.quantityKg}kg × {formatNPR(inc.ratePerKg)}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-ink-muted tabular-nums hidden md:table-cell whitespace-nowrap">{inc.date}</td>

                        {/* Payment status badge */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${meta.bg} ${meta.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {meta.label}
                            </span>
                            {/* {income page} */}
                            {due > 0 && (
                              <button
                                onClick={() => setPaying(inc)}
                                className="text-[11px] font-medium text-brand hover:underline whitespace-nowrap"
                              >
                                + Add payment
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3 text-right">
                          <p className="font-semibold text-brand tabular-nums whitespace-nowrap">+{formatNPR(total)}</p>
                          {due > 0 && (
                            <p className="text-[11px] text-ink-faint tabular-nums whitespace-nowrap">
                              {formatNPR(due)} due
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(inc)}
                              className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-brand-soft transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(inc.id, inc.crop, inc.buyer)}
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

      {/* Modal: add/edit sale — sibling of the disabled div, always interactive */}
      {showForm && (
        <IncomeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={
            editing
              ? {
                  date: editing.date,
                  crop: editing.crop,
                  buyer: editing.buyer,
                  quantityKg: editing.quantityKg,
                  ratePerKg: editing.ratePerKg,
                  amountPaid: editing.amountPaid,
                  note: editing.note,
                  billImage: editing.billImage,
                }
              : undefined
          }
        />
      )}

      {/* Modal: quick record-payment — also a sibling */}
      {paying && (
        <RecordPaymentModal
          income={paying}
          onConfirm={handleConfirmPayment}
          onCancel={() => setPaying(null)}
        />
      )}

      {/* Modal: delete confirmation — opens when a trash icon is clicked */}
      {incomeToDelete && (
        <ConfirmDeleteModal
          isOpen={incomeToDelete !== null}
          title="Delete sale?"
          description={
            <>
              This will permanently delete the sale of{" "}
              <span className="font-semibold text-negative">{incomeToDelete.crop}</span> to{" "}
              <span className="font-semibold text-negative">{incomeToDelete.buyer}</span>.
              This action cannot be undone.
            </>
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setIncomeToDelete(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}