// ─────────────────────────────────────────────
//  KhetiBahi – ExpenseRow
//  One row in the expenses list.
//  Shows all key info + edit/delete buttons.
// ─────────────────────────────────────────────

"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Expense } from "@/app/types";
import { CATEGORIES, CROPS } from "@/app/utils/constants";
import { formatNPR, prettyDate } from "@/app/utils/helpers";
import ImageLightbox from "@/app/components/ImageLightbox";

interface ExpenseRowProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const cat  = CATEGORIES.find((c) => c.value === expense.category);
  const crop = CROPS.find((c) => c.value === expense.crop);
  const [showBill, setShowBill] = useState(false);

  function handleDelete() {
    if (confirm(`Delete this ₹${expense.amount} ${expense.category} expense?`)) {
      onDelete(expense.id);
    }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors border-b border-line last:border-0">
      {/* Category badge */}
      <span className="flex-shrink-0 text-lg" title={expense.category}>
        {cat?.emoji ?? "📦"}
      </span>

      {/* Bill photo thumbnail, if attached */}
      {expense.billImage && (
        <button
          type="button"
          onClick={() => setShowBill(true)}
          className="flex-shrink-0"
          title="View bill photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expense.billImage}
            alt="Bill"
            className="w-9 h-9 rounded-lg object-cover border border-line"
          />
        </button>
      )}
      {showBill && expense.billImage && (
        <ImageLightbox src={expense.billImage} onClose={() => setShowBill(false)} />
      )}

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat?.bg} ${cat?.text}`}>
            {expense.category}
          </span>
          {expense.crop !== "All Crops" && (
            <span className="text-xs text-ink-muted">
              {crop?.emoji} {expense.crop}
            </span>
          )}
        </div>
        {expense.note && (
          <p className="text-xs text-ink-muted truncate mt-0.5">{expense.note}</p>
        )}
        <p className="text-xs text-ink-faint mt-0.5">{prettyDate(expense.date)}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-ink tabular-nums">{formatNPR(expense.amount)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="p-1.5 rounded-lg text-ink-faint hover:text-brand hover:bg-brand-soft transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-ink-faint hover:text-negative hover:bg-negative-soft transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
