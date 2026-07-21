// ─────────────────────────────────────────────
//  KhetiBahi – LoanForm
//  Logs a credit/loan (udhaar): who it's from,
//  how much, and how much has already been repaid.
//  Same "status pill drives the amount" pattern as
//  IncomeForm, just flipped: amountRepaid instead
//  of amountPaid.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { X, Save, CheckCircle2, Clock3, CircleDollarSign } from "lucide-react";
import { LoanFormData, LoanSource, PaymentStatus } from "@/app/types";
import { LOAN_SOURCES, CROPS } from "@/app/utils/constants";
import { todayISO, formatNPR, getLoanStatus } from "@/app/utils/helpers";
import ImageUploadField from "@/app/components/ImageUploadField";

interface LoanFormProps {
  onSubmit: (data: LoanFormData) => void;
  onCancel: () => void;
  initialData?: LoanFormData;
}

const EMPTY: LoanFormData = {
  lenderName: "",
  source: "Agrovet",
  crop: undefined,
  amount: 0,
  amountRepaid: 0,
  dateTaken: todayISO(),
  dueDate: undefined,
  interestRate: 0,
  note: "",
};

export default function LoanForm({ onSubmit, onCancel, initialData }: LoanFormProps) {
  const [form, setForm] = useState<LoanFormData>(initialData ?? EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof LoanFormData, string>>>({});

  // Which repayment-status pill is active. Drives amountRepaid: "Paid"
  // always tracks the full amount, "Due" is always 0, "Partial" is
  // whatever the farmer types in. New udhaar defaults to "Due" since
  // that's the common case — you log the credit the day you take it,
  // before you've repaid anything.
  const [status, setStatus] = useState<PaymentStatus>(() =>
    initialData ? getLoanStatus(initialData) : "Due"
  );

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setStatus(getLoanStatus(initialData));
    }
  }, [initialData]);

  const due = Math.max(form.amount - form.amountRepaid, 0);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.lenderName.trim()) e.lenderName = "Lender name is required";
    if (!form.dateTaken) e.dateTaken = "Date is required";
    if (form.amount <= 0) e.amount = "Must be greater than 0";
    if (form.amountRepaid < 0) e.amountRepaid = "Cannot be negative";
    if (form.amountRepaid > form.amount) e.amountRepaid = "Cannot exceed the loan amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  function set<K extends keyof LoanFormData>(key: K, value: LoanFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Keep amountRepaid consistent with the active status pill whenever
      // the loan amount changes.
      if (key === "amount") {
        if (status === "Paid") next.amountRepaid = next.amount;
        else if (status === "Due") next.amountRepaid = 0;
        else next.amountRepaid = Math.min(next.amountRepaid, next.amount); // Partial — never exceed a shrinking total
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleStatusPick(next: PaymentStatus) {
    setStatus(next);
    setForm((prev) => {
      if (next === "Paid") return { ...prev, amountRepaid: prev.amount };
      if (next === "Due") return { ...prev, amountRepaid: 0 };
      // Partial: keep the existing figure if it's already sensible,
      // otherwise default to half the amount as a starting point.
      const sensible = prev.amountRepaid > 0 && prev.amountRepaid < prev.amount;
      return { ...prev, amountRepaid: sensible ? prev.amountRepaid : Math.round(prev.amount / 2) };
    });
    setErrors((prev) => ({ ...prev, amountRepaid: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-lift w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bahi-ledger flex items-center justify-between px-6 pt-5 pb-4 border-b border-line rounded-t-3xl">
          <h2 className="text-lg font-display font-bold text-ink">
            {initialData ? "Edit Udhaar" : "Log Udhaar (Credit)"}
          </h2>
          <button onClick={onCancel} className="p-1.5 rounded-full text-ink-faint hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lender name */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Lender name</label>
            <input
              type="text"
              value={form.lenderName}
              onChange={(e) => set("lenderName", e.target.value)}
              placeholder="e.g. Ram Krishi Pasal, Sunita didi"
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {errors.lenderName && <p className="text-negative text-xs mt-1">{errors.lenderName}</p>}
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Source</label>
            <div className="grid grid-cols-2 gap-2">
              {LOAN_SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("source", s.value as LoanSource)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                    form.source === s.value
                      ? "bg-brand-soft text-brand border-brand/30 font-semibold"
                      : "border-line text-ink-muted hover:border-ink-faint"
                  }`}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop (optional) */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Crop / purpose <span className="text-ink-faint">(optional)</span>
            </label>
            <select
              value={form.crop ?? ""}
              onChange={(e) => set("crop", e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Not tied to a specific crop</option>
              {CROPS.filter((c) => c.value !== "All Crops").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date taken + due date side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Date taken</label>
              <input
                type="date"
                value={form.dateTaken}
                max={todayISO()}
                onChange={(e) => set("dateTaken", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              {errors.dateTaken && <p className="text-negative text-xs mt-1">{errors.dateTaken}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">
                Due date <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                type="date"
                value={form.dueDate ?? ""}
                onChange={(e) => set("dueDate", e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Amount taken (NPR)</label>
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

          {/* Interest rate (optional) */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Interest rate <span className="text-ink-faint">(% per year, optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.interestRate || ""}
                onChange={(e) => set("interestRate", Number(e.target.value))}
                placeholder="0"
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">%</span>
            </div>
            <p className="text-xs text-ink-faint mt-1">
              Leave at 0 if this udhaar doesn&apos;t carry interest. You can log interest payments
              separately once it&apos;s saved.
            </p>
          </div>

          {/* Repayment status */}
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">Repayment status</label>
            <div className="grid grid-cols-3 gap-2">
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
                Not Repaid
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
                onClick={() => handleStatusPick("Paid")}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  status === "Paid"
                    ? "bg-brand-soft text-brand border-brand/30"
                    : "border-line text-ink-muted hover:border-ink-faint"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Fully Repaid
              </button>
            </div>

            {/* Only ask for the exact figure when it's a partial repayment —
                Paid/Due already imply the number (amount or zero). */}
            {status === "Partial" && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-ink-muted">Amount repaid so far</label>
                  {due > 0 && (
                    <span className="text-xs text-accent font-medium tabular-nums">
                      Still owe: {formatNPR(due)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={form.amount}
                    value={form.amountRepaid || ""}
                    onChange={(e) => set("amountRepaid", Number(e.target.value))}
                    placeholder="0"
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                {errors.amountRepaid && <p className="text-negative text-xs mt-1">{errors.amountRepaid}</p>}
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
              placeholder="e.g. Urea and pesticide on credit before Dashain…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>

          {/* Receipt / chit photo */}
          <ImageUploadField
            label="Receipt / khata chit photo"
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
              {initialData ? "Save Changes" : "Log Udhaar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
