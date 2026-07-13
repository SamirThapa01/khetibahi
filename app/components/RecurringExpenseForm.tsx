"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES, CROPS } from "@/app/utils/constants";

const INPUT_CLS =
  "w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export interface RecurringExpenseSubmitData {
  category: string;
  crop: string;
  amount: number;
  note: string;
  frequency: "weekly" | "monthly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
}

interface RecurringExpenseFormProps {
  onSubmit: (data: RecurringExpenseSubmitData) => Promise<void>;
  onCancel: () => void;
}

export default function RecurringExpenseForm({ onSubmit, onCancel }: RecurringExpenseFormProps) {
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [crop, setCrop] = useState<string>(CROPS[0].value);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        category,
        crop,
        amount: Number(amount),
        note,
        frequency,
        dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : undefined,
        dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : undefined,
        startDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bahi-ledger flex items-center justify-between px-6 pt-5 pb-4 border-b border-line rounded-t-3xl">
          <h2 className="text-lg font-display font-bold text-ink">New Recurring Expense</h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT_CLS}>
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
                {CROPS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Amount (NPR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="e.g. 2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Weekly labor wages"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Frequency</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  checked={frequency === "monthly"}
                  onChange={() => setFrequency("monthly")}
                  className="accent-[var(--brand)]"
                />
                Monthly
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                  className="accent-[var(--brand)]"
                />
                Weekly
              </label>
            </div>
          </div>

          {frequency === "monthly" ? (
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Day of month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Day of week</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className={INPUT_CLS}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Starts on</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}