// ─────────────────────────────────────────────
//  KhetiBahi – RecordInterestPaymentModal
//
//  Same idea as RecordRepaymentModal, but for interest
//  instead of principal — these are tracked separately
//  since a lender may charge interest on top of the
//  amount owed. Interest accrued is an estimate (simple
//  interest on the outstanding principal since the loan
//  was taken), so this lets the farmer type in whatever
//  the lender actually asked for, defaulting to that estimate.
// ─────────────────────────────────────────────

"use client";

import { useState } from "react";
import { X, Percent } from "lucide-react";
import { Loan } from "@/app/types";
import { formatNPR, calculateAccruedInterest, totalInterestPaid, todayISO } from "@/app/utils/helpers";

interface RecordInterestPaymentModalProps {
  loan: Loan;
  onConfirm: (date: string, amount: number) => void;
  onCancel: () => void;
}

export default function RecordInterestPaymentModal({
  loan,
  onConfirm,
  onCancel,
}: RecordInterestPaymentModalProps) {
  const accrued = calculateAccruedInterest(loan);
  const alreadyPaid = totalInterestPaid(loan);
  const estimatedDue = Math.max(accrued - alreadyPaid, 0);

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState<number>(Math.round(estimatedDue) || 0);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!date) {
      setError("Pick a date.");
      return;
    }
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    onConfirm(date, amount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
          <h2 className="text-lg font-display font-bold text-ink flex items-center gap-2">
            <Percent className="w-5 h-5 text-brand" />
            Record Interest Payment
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-muted">
            At <span className="font-semibold text-ink">{loan.interestRate}%/year</span>, interest
            accrued so far on this udhaar is about{" "}
            <span className="font-semibold text-accent tabular-nums">{formatNPR(Math.round(accrued))}</span>
            {alreadyPaid > 0 && (
              <>
                {" "}({formatNPR(Math.round(alreadyPaid))} already paid, roughly{" "}
                {formatNPR(Math.round(estimatedDue))} outstanding)
              </>
            )}
            .
          </p>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Date paid</label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => { setDate(e.target.value); setError(null); }}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Interest amount paid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
              <input
                type="number"
                min={0}
                autoFocus
                value={amount || ""}
                onChange={(e) => { setAmount(Number(e.target.value)); setError(null); }}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            {error && <p className="text-negative text-xs mt-1">{error}</p>}
            {estimatedDue > 0 && Math.round(estimatedDue) !== amount && (
              <button
                type="button"
                onClick={() => { setAmount(Math.round(estimatedDue)); setError(null); }}
                className="text-xs text-brand font-medium mt-1.5 hover:underline"
              >
                Use the estimated {formatNPR(Math.round(estimatedDue))}
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-line text-ink-muted text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors"
            >
              Save Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
