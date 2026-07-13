// ─────────────────────────────────────────────
//  KhetiBahi – IncomeForm
//  Logs a sale: buyer, crop, quantity, rate.
//  Total is computed live as you type.
//  Supports partial payment (amountPaid < total).
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { X, Save, CheckCircle2, Clock3, CircleDollarSign } from "lucide-react";
import { IncomeFormData, CropType, PaymentStatus } from "@/app/types";
import { CROPS, SEASONS } from "@/app/utils/constants";
import { todayISO, formatNPR, getPaymentStatus } from "@/app/utils/helpers";
import ImageUploadField from "@/app/components/ImageUploadField";

interface IncomeFormProps {
  onSubmit: (data: IncomeFormData) => void;
  onCancel: () => void;
  initialData?: IncomeFormData;
}

const EMPTY: IncomeFormData = {
  date: todayISO(),
  crop: "Tomato",
  buyer: "",
  quantityKg: 0,
  ratePerKg: 0,
  amountPaid: 0,
  note: "",
};

// Income is always for a specific crop — "All Crops" doesn't make sense for a sale
const SALE_CROPS = CROPS.filter((c) => c.value !== "All Crops");

export default function IncomeForm({ onSubmit, onCancel, initialData }: IncomeFormProps) {
  const [form, setForm] = useState<IncomeFormData>(initialData ?? EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof IncomeFormData, string>>>({});
  // Which payment-status pill is active. Drives amountPaid: "Paid" always
  // tracks the live total, "Due" is always 0, "Partial" is whatever the
  // farmer types in. New sales default to "Paid" since that's the common case.
  const [status, setStatus] = useState<PaymentStatus>(() =>
    initialData ? getPaymentStatus(initialData) : "Paid"
  );

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setStatus(getPaymentStatus(initialData));
    }
  }, [initialData]);

  const total = form.quantityKg * form.ratePerKg;
  const due = Math.max(total - form.amountPaid, 0);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.date) e.date = "Date is required";
    if (!form.buyer.trim()) e.buyer = "Buyer name is required";
    if (form.quantityKg <= 0) e.quantityKg = "Must be greater than 0";
    if (form.ratePerKg <= 0) e.ratePerKg = "Must be greater than 0";
    if (form.amountPaid < 0) e.amountPaid = "Cannot be negative";
    if (form.amountPaid > total) e.amountPaid = "Cannot exceed total amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  function set<K extends keyof IncomeFormData>(key: K, value: IncomeFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Keep amountPaid consistent with the active payment-status pill
      // whenever quantity or rate change the total.
      if (key === "quantityKg" || key === "ratePerKg") {
        const newTotal = next.quantityKg * next.ratePerKg;
        if (status === "Paid") next.amountPaid = newTotal;
        else if (status === "Due") next.amountPaid = 0;
        else next.amountPaid = Math.min(next.amountPaid, newTotal); // Partial — never exceed a shrinking total
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleStatusPick(next: PaymentStatus) {
    setStatus(next);
    setForm((prev) => {
      const t = prev.quantityKg * prev.ratePerKg;
      if (next === "Paid") return { ...prev, amountPaid: t };
      if (next === "Due") return { ...prev, amountPaid: 0 };
      // Partial: keep the existing figure if it's already sensible,
      // otherwise default to half the total as a starting point.
      const sensible = prev.amountPaid > 0 && prev.amountPaid < t;
      return { ...prev, amountPaid: sensible ? prev.amountPaid : Math.round(t / 2) };
    });
    setErrors((prev) => ({ ...prev, amountPaid: undefined }));
  }

  function handlePaidChange(value: number) {
    set("amountPaid", value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bahi-ledger flex items-center justify-between px-6 pt-5 pb-4 border-b border-line rounded-t-3xl">
          <h2 className="text-lg font-display font-bold text-ink">
            {initialData ? "Edit Sale" : "Log a Sale"}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => set("date", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.date && <p className="text-negative text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Crop */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Crop sold</label>
            <div className="grid grid-cols-2 gap-2">
              {SALE_CROPS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("crop", c.value as CropType)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                    form.crop === c.value
                      ? "bg-brand-soft text-brand border-brand/30 font-semibold"
                      : "border-line text-ink-muted hover:border-ink-faint"
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
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

          {/* Buyer */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Buyer name</label>
            <input
              type="text"
              value={form.buyer}
              onChange={(e) => set("buyer", e.target.value)}
              placeholder="e.g. Kalimati Vegetable Market"
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.buyer && <p className="text-negative text-xs mt-1">{errors.buyer}</p>}
          </div>

          {/* Quantity + Rate side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Quantity (kg)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.quantityKg || ""}
                onChange={(e) => set("quantityKg", Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              {errors.quantityKg && <p className="text-negative text-xs mt-1">{errors.quantityKg}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Rate (₹/kg)</label>
              <input
                type="number"
                min={0}
                value={form.ratePerKg || ""}
                onChange={(e) => set("ratePerKg", Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              {errors.ratePerKg && <p className="text-negative text-xs mt-1">{errors.ratePerKg}</p>}
            </div>
          </div>

          {/* Live total */}
          <div className="bg-brand-soft rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-brand-dark font-medium">Total amount</span>
            <span className="text-lg font-display font-bold text-brand tabular-nums">{formatNPR(total)}</span>
          </div>

          {/* Payment status */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">Payment status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusPick("Paid")}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  status === "Paid"
                    ? "bg-brand-soft text-brand border-brand/30"
                    : "border-line text-ink-muted hover:border-ink-faint"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Fully Paid
              </button>
              <button
                type="button"
                onClick={() => handleStatusPick("Partial")}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  status === "Partial"
                    ? "bg-accent-soft text-accent border-accent/30"
                    : "border-line text-ink-muted hover:border-ink-faint"
                }`}
              >
                <CircleDollarSign className="w-4 h-4" />
                Partial
              </button>
              <button
                type="button"
                onClick={() => handleStatusPick("Due")}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  status === "Due"
                    ? "bg-negative-soft text-negative border-negative/30"
                    : "border-line text-ink-muted hover:border-ink-faint"
                }`}
              >
                <Clock3 className="w-4 h-4" />
                Not Paid
              </button>
            </div>

            {/* Only ask for the exact figure when it's a partial payment —
                Paid/Due already imply the number (total or zero). */}
            {status === "Partial" && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-ink-muted">Amount received</label>
                  {due > 0 && (
                    <span className="text-xs text-accent font-medium tabular-nums">
                      Due: {formatNPR(due)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={total}
                    value={form.amountPaid || ""}
                    onChange={(e) => handlePaidChange(Number(e.target.value))}
                    placeholder="0"
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                {errors.amountPaid && <p className="text-negative text-xs mt-1">{errors.amountPaid}</p>}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Note <span className="text-ink-faint">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Sold at the morning haat bazaar…"
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
              {initialData ? "Save Changes" : "Log Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
