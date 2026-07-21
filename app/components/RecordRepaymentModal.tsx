// ─────────────────────────────────────────────
//  KhetiBahi – RecordRepaymentModal
//
//  Same idea as RecordPaymentModal on the Income
//  side, flipped for loans: "I just paid back some/
//  all of what I owe this lender." Faster than
//  reopening the full edit-loan form to bump one number.
// ─────────────────────────────────────────────

"use client";

import { useState } from "react";
import { X, CircleDollarSign } from "lucide-react";
import { Loan } from "@/app/types";
import { formatNPR, amountDueForLoan } from "@/app/utils/helpers";

interface RecordRepaymentModalProps {
  loan: Loan;
  onConfirm: (extraRepaid: number) => void;
  onCancel: () => void;
}

export default function RecordRepaymentModal({ loan, onConfirm, onCancel }: RecordRepaymentModalProps) {
  const due = amountDueForLoan(loan);
  const [amount, setAmount] = useState<number>(due);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (amount > due) {
      setError(`Cannot exceed the outstanding due of ${formatNPR(due)}.`);
      return;
    }
    onConfirm(amount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
          <h2 className="text-lg font-display font-bold text-ink flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-brand" />
            Record Repayment
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-muted">
            You owe <span className="font-semibold text-ink">{loan.lenderName}</span>{" "}
            <span className="font-semibold text-accent tabular-nums">{formatNPR(due)}</span> from the
            udhaar taken on {loan.dateTaken}.
          </p>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Amount repaid now</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
              <input
                type="number"
                min={0}
                max={due}
                autoFocus
                value={amount || ""}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setError(null);
                }}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            {error && <p className="text-negative text-xs mt-1">{error}</p>}
            <button
              type="button"
              onClick={() => { setAmount(due); setError(null); }}
              className="text-xs text-brand font-medium mt-1.5 hover:underline"
            >
              Repaid the full {formatNPR(due)}
            </button>
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
              Save Repayment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
