// ─────────────────────────────────────────────
//  KhetiBahi – IncomeRow
//  One row in the income/sales list.
//  Shows buyer, crop, qty × rate = total, and
//  a paid/due badge.
// ─────────────────────────────────────────────

"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Income } from "@/app/types";
import { CROPS } from "@/app/utils/constants";
import { formatNPR, prettyDate } from "@/app/utils/helpers";
import ImageLightbox from "@/app/components/ImageLightbox";

interface IncomeRowProps {
  income: Income;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export default function IncomeRow({ income, onEdit, onDelete }: IncomeRowProps) {
  const crop = CROPS.find((c) => c.value === income.crop);
  const total = income.quantityKg * income.ratePerKg;
  const due = total - income.amountPaid;
  const [showBill, setShowBill] = useState(false);

  function handleDelete() {
    if (confirm(`Delete this sale of ${income.quantityKg}kg ${income.crop} to ${income.buyer}?`)) {
      onDelete(income.id);
    }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors border-b border-line last:border-0">
      <span className="flex-shrink-0 text-lg" title={income.crop}>
        {crop?.emoji ?? "🌱"}
      </span>

      {/* Bill photo thumbnail, if attached */}
      {income.billImage && (
        <button
          type="button"
          onClick={() => setShowBill(true)}
          className="flex-shrink-0"
          title="View bill photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={income.billImage}
            alt="Bill"
            className="w-9 h-9 rounded-lg object-cover border border-line"
          />
        </button>
      )}
      {showBill && income.billImage && (
        <ImageLightbox src={income.billImage} onClose={() => setShowBill(false)} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
            {income.crop}
          </span>
          <span className="text-xs text-ink-muted tabular-nums">
            {income.quantityKg}kg × {formatNPR(income.ratePerKg)}
          </span>
          {due > 0 ? (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-accent-soft text-accent">
              Due {formatNPR(due)}
            </span>
          ) : (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-brand-soft text-brand">
              Paid
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted truncate mt-0.5">
          Sold to <span className="font-medium text-ink">{income.buyer}</span>
          {income.note && ` · ${income.note}`}
        </p>
        <p className="text-xs text-ink-faint mt-0.5">{prettyDate(income.date)}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-brand tabular-nums">+{formatNPR(total)}</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(income)}
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
