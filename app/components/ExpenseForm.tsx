// ─────────────────────────────────────────────
//  KhetiBahi – ExpenseForm
//  Used for both adding and editing.
//  If `initialData` is passed → edit mode.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { ExpenseFormData } from "@/app/types";
import { CATEGORIES, CROPS, SEASONS } from "@/app/utils/constants"; 
import { todayISO } from "@/app/utils/helpers";
import ImageUploadField from "@/app/components/ImageUploadField";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialData?: ExpenseFormData;
}

const EMPTY: ExpenseFormData = {
  date: todayISO(),
  category: "Pesticide",
  crop: "All Crops",
  amount: 0,
  note: "",
  season: ""
};

export default function ExpenseForm({ onSubmit, onCancel, initialData }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(initialData ?? EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  // If editing, sync when initialData changes
  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.date)           e.date     = "Date is required";
    if (form.amount <= 0)     e.amount   = "Amount must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  function set<K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bahi-ledger flex items-center justify-between px-6 pt-5 pb-4 border-b border-line rounded-t-3xl">
          <h2 className="text-lg font-display font-bold text-ink">
            {initialData ? "Edit Expense" : "Add New Expense"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => set("date", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.date && <p className="text-negative text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set("category", cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                    form.category === cat.value
                      ? `${cat.bg} ${cat.text} border-current font-semibold`
                      : "border-line text-ink-muted hover:border-ink-faint"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Crop
            </label>
            <select
              value={form.crop}
              onChange={(e) => set("crop", e.target.value as ExpenseFormData["crop"])}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Season <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              list="seasons"
              type="text"
              value={form.season ?? ""}
              onChange={(e) => set("season", e.target.value)}
              placeholder="e.g. Kharif 2026"
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <datalist id="seasons">
              {SEASONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Amount (NPR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
              <input
                type="number"
                min={0}
                value={form.amount || ""}
                onChange={(e) => set("amount", Number(e.target.value))}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            {errors.amount && <p className="text-negative text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Note <span className="text-ink-faint">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Bought urea fertilizer from Kalimati…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          {/* Bill photo */}
          <ImageUploadField
            label="Bill / receipt photo"
            value={form.billImage}
            onChange={(dataUrl) => set("billImage", dataUrl)}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-line text-ink-muted text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" />
              {initialData ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
