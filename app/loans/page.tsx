// ─────────────────────────────────────────────
//  KhetiBahi – Loans (Udhaar) Page
//  Same visual language as the Income page:
//  stat cards at top, filter bar, then a clean
//  list of records with edit/delete/repay actions.
//
//  "Udhaar" — buying pesticide or seed on credit
//  from the local agrovet, or borrowing from a
//  cooperative/relative — is one of the most common
//  ways Nepali smallholder farmers finance a season.
//  This page tracks that debt the same way Income
//  tracks money owed TO the farmer, just flipped.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HandCoins,
} from "lucide-react";
import { useLoans } from "@/app/hooks/useLoans";
import LoanForm from "@/app/components/LoanForm";
import LoanFilterBar from "@/app/components/LoanFilterBar";
import RecordRepaymentModal from "@/app/components/RecordRepaymentModal";
import ConfirmDeleteModal from "@/app/components/Confirmdeletemodal";
import ImageLightbox from "@/app/components/ImageLightbox";
import { Loan, LoanFormData } from "@/app/types";
import { formatNPR, getLoanStatus, amountDueForLoan, prettyDate } from "@/app/utils/helpers";
import { LOAN_SOURCES } from "@/app/utils/constants";

// Visual language for each repayment status — reused across the badge and the stat card
const STATUS_META = {
  Paid: { label: "Repaid", Icon: CheckCircle2, text: "text-brand", bg: "bg-brand-soft" },
  Partial: { label: "Partial", Icon: CircleDollarSign, text: "text-accent", bg: "bg-accent-soft" },
  Due: { label: "Due", Icon: Clock3, text: "text-negative", bg: "bg-negative-soft" },
} as const;

export default function LoansPage() {
  const {
    filteredLoans,
    totalLoans,
    totalDue,
    statusSummary,
    isLoaded,
    addLoan,
    updateLoan,
    deleteLoan,
    recordRepayment,
    filters,
    setFilter,
    resetFilters,
  } = useLoans();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [repaying, setRepaying] = useState<Loan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; lenderName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBillFor, setShowBillFor] = useState<string | null>(null);

  const isAnyModalOpen = showForm || repaying !== null || deleteTarget !== null;

  // 🔒 Lock background scroll while a modal is open — same pattern as Income/Expenses pages.
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

  function handleSubmit(data: LoanFormData) {
    if (editing) updateLoan(editing.id, data);
    else addLoan(data);
    setShowForm(false);
    setEditing(null);
  }

  function handleEdit(loan: Loan) {
    setEditing(loan);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: string, lenderName: string) {
    setDeleteTarget({ id, lenderName });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteLoan(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleConfirmRepayment(extraRepaid: number) {
    if (repaying) recordRepayment(repaying.id, extraRepaid);
    setRepaying(null);
  }

  const totalRepaid = totalLoans - totalDue;
  const pendingCount = statusSummary.filter((s) => s.status !== "Paid").reduce((sum, s) => sum + s.count, 0);

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
            <h1 className="text-2xl font-display font-bold text-ink">Udhaar (Loans)</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Track credit from the agrovet, cooperative, bank, or a relative — and pay it back over time.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-soft transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Udhaar</span>
          </button>
        </div>

        {/* ── Stat cards ── */}
        {filteredLoans.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-negative-soft">
                🤝
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-negative mb-0.5">Total Udhaar Taken</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalLoans)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-[#e8f5e9]">
                ✅
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#2e7d32] mb-0.5">Repaid So Far</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalRepaid)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl text-xl flex-shrink-0 bg-accent-soft">
                ⏳
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-accent mb-0.5">Still Owed</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {formatNPR(totalDue)}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-negative-soft">
                <HandCoins className="w-5 h-5 text-negative" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-negative mb-0.5">Open Udhaar</p>
                <p className="text-base font-display font-bold text-ink tabular-nums truncate">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter + list ── */}
        <LoanFilterBar filters={filters} onFilter={setFilter} onReset={resetFilters} />

        {filteredLoans.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
            <HandCoins className="w-10 h-10 text-brand mx-auto mb-3" />
            <h2 className="font-display font-semibold text-ink mb-1">No udhaar logged yet</h2>
            <p className="text-sm text-ink-muted mb-4">
              Log any credit you&apos;ve taken — from the agrovet, a cooperative, or a neighbor — and track it
              until it&apos;s fully repaid.
            </p>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log First Udhaar
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line gap-3">
              <h2 className="font-display font-semibold text-ink text-sm flex-shrink-0">Udhaar Records</h2>
              <span className="text-xs text-ink-muted tabular-nums text-right truncate">
                {filteredLoans.length} record{filteredLoans.length === 1 ? "" : "s"} · {formatNPR(totalLoans)}
              </span>
            </div>

            <div className="divide-y divide-line">
              {filteredLoans.map((loan) => {
                const src = LOAN_SOURCES.find((s) => s.value === loan.source);
                const due = amountDueForLoan(loan);
                const status = getLoanStatus(loan);
                const meta = STATUS_META[status];
                const StatusIcon = meta.Icon;

                return (
                  <div key={loan.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                    <span className="flex-shrink-0 text-lg" title={loan.source}>
                      {src?.emoji ?? "🤝"}
                    </span>

                    {loan.billImage && (
                      <button
                        type="button"
                        onClick={() => setShowBillFor(loan.id)}
                        className="flex-shrink-0"
                        title="View receipt photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loan.billImage}
                          alt="Receipt"
                          className="w-9 h-9 rounded-lg object-cover border border-line"
                        />
                      </button>
                    )}
                    {showBillFor === loan.id && loan.billImage && (
                      <ImageLightbox src={loan.billImage} onClose={() => setShowBillFor(null)} />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink truncate">{loan.lenderName}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${meta.bg} ${meta.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted truncate mt-0.5">
                        {src?.label ?? loan.source}
                        {loan.crop && ` · ${loan.crop}`}
                        {loan.note && ` · ${loan.note}`}
                      </p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        Taken {prettyDate(loan.dateTaken)}
                        {loan.dueDate && ` · Due ${prettyDate(loan.dueDate)}`}
                      </p>
                      {due > 0 && (
                        <button
                          onClick={() => setRepaying(loan)}
                          className="text-[11px] font-medium text-brand hover:underline mt-1"
                        >
                          + Record repayment
                        </button>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-negative tabular-nums">{formatNPR(loan.amount)}</p>
                      {due > 0 && (
                        <p className="text-[11px] text-ink-faint tabular-nums">{formatNPR(due)} due</p>
                      )}
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(loan)}
                        className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-brand-soft transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id, loan.lenderName)}
                        className="p-1.5 rounded-lg text-ink-faint hover:text-negative hover:bg-negative-soft transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: add/edit udhaar — sibling of the disabled div, always interactive */}
      {showForm && (
        <LoanForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={
            editing
              ? {
                  lenderName: editing.lenderName,
                  source: editing.source,
                  crop: editing.crop,
                  amount: editing.amount,
                  amountRepaid: editing.amountRepaid,
                  dateTaken: editing.dateTaken,
                  dueDate: editing.dueDate,
                  note: editing.note,
                  billImage: editing.billImage,
                }
              : undefined
          }
        />
      )}

      {/* Modal: quick record-repayment — also a sibling */}
      {repaying && (
        <RecordRepaymentModal
          loan={repaying}
          onConfirm={handleConfirmRepayment}
          onCancel={() => setRepaying(null)}
        />
      )}

      {/* Modal: delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={deleteTarget !== null}
          title="Delete udhaar record?"
          description={
            <>
              This will permanently delete the udhaar from{" "}
              <span className="font-semibold text-negative">{deleteTarget.lenderName}</span>. This action
              cannot be undone.
            </>
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
