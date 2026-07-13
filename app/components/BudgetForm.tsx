"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES, CROPS } from "@/app/utils/constants";

const INPUT_CLS =
  "w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

interface BudgetFormProps {
  defaultMonth: string;
  onSubmit: (category: string, crop: string, month: string, amount: number) => Promise<void>;
  onCancel: () => void;
}

export default function BudgetForm({ defaultMonth, onSubmit, onCancel }: BudgetFormProps) {
  const [category, setCategory] = useState("All");
  const [crop, setCrop] = useState("All");
  const [month, setMonth] = useState(defaultMonth);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(category, crop, month, Number(amount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bahi-ledger flex items-center justify-between px-6 pt-5 pb-4 border-b border-line rounded-t-3xl">
          <h2 className="text-lg font-display font-bold text-ink">Set Budget</h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT_CLS}>
              <option value="All">🗂️ All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className={INPUT_CLS}>
              <option value="All">🌾 All Crops</option>
              {CROPS.filter((c) => c.value !== "All Crops").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Budget Amount (NPR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {error && <p className="text-negative text-xs">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink-muted hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-soft transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}