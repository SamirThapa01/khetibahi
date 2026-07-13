"use client";

import { useState } from "react";
import { CATEGORIES, CROPS } from "@/app/utils/constants";
import { useRecurringExpenses } from "@/app/hooks/useRecurringExpenses";
import { ExpenseCategory, CropType } from "@/app/types";

export default function RecurringExpenseForm({ onClose }: { onClose: () => void }) {
  const { addRecurring } = useRecurringExpenses();
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [crop, setCrop] = useState(CROPS[0].value);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addRecurring({
        category,
        crop,
        amount: Number(amount),
        note,
        frequency,
        dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : undefined,
        dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : undefined,
        startDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">New Recurring Expense</h2>

        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="input">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={crop} onChange={(e) => setCrop(e.target.value as CropType | "All Crops")} className="input">
            {CROPS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <input type="number" min="0" step="0.01" required placeholder="Amount (NPR)"
          value={amount} onChange={(e) => setAmount(e.target.value)} className="input w-full" />
        <input type="text" placeholder="Note (optional)"
          value={note} onChange={(e) => setNote(e.target.value)} className="input w-full" />

        <div className="flex gap-3">
          <label className="flex items-center gap-2">
            <input type="radio" checked={frequency === "monthly"} onChange={() => setFrequency("monthly")} />
            Monthly
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={frequency === "weekly"} onChange={() => setFrequency("weekly")} />
            Weekly
          </label>
        </div>

        {frequency === "monthly" ? (
          <input type="number" min="1" max="31" placeholder="Day of month"
            value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="input w-full" />
        ) : (
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="input w-full">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        )}

        <div>
          <label className="text-sm text-gray-500">Starts on</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-green-600 text-white">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}