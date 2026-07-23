// ─────────────────────────────────────────────
//  KhetiBahi – CropDetailClient
//
//  Everything about ONE crop: profit/loss,
//  every sale (with payment status), every
//  expense tagged to it, and — new — a Buyer
//  History search scoped to just this crop,
//  plus a one-click "export all buyers" PDF.
// ─────────────────────────────────────────────

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Coins,
  Wallet,
  Scale,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Inbox,
  Plus,
  Users,
  FileDown,
} from "lucide-react";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useIncome } from "@/app/hooks/useIncome";
import { CROPS, CATEGORIES } from "@/app/utils/constants";
import { formatNPR, prettyDate, buildCropProfitLoss, getPaymentStatus, amountDueFor } from "@/app/utils/helpers";
import { CropDetailSkeleton } from "@/app/components/Skeleton";
import CropBuyerHistoryModal from "@/app/components/CropBuyerHistoryModal";
import { exportCropBuyersToPDF } from "@/app/utils/pdfExport";

const STATUS_META = {
  Paid:    { label: "Paid",    Icon: CheckCircle2,     text: "text-brand",    bg: "bg-brand-soft" },
  Partial: { label: "Partial", Icon: CircleDollarSign, text: "text-accent",   bg: "bg-accent-soft" },
  Due:     { label: "Due",     Icon: Clock3,           text: "text-negative", bg: "bg-negative-soft" },
} as const;

export default function CropDetailClient({ cropParam }: { cropParam: string }) {
  const { expenses, isLoaded } = useExpenses();
  const { income, isLoaded: incomeLoaded } = useIncome();
  const [buyerHistoryOpen, setBuyerHistoryOpen] = useState(false);

  const cropMeta = CROPS.find((c) => c.value === cropParam && c.value !== "All Crops");

  const cropIncome = useMemo(
    () => income.filter((i) => i.crop === cropParam).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [income, cropParam]
  );
  const cropExpenses = useMemo(
    () => expenses.filter((e) => e.crop === cropParam).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, cropParam]
  );

  const pl = useMemo(() => {
    const all = buildCropProfitLoss(expenses, income);
    return all.find((p) => p.crop === cropParam);
  }, [expenses, income, cropParam]);

  if (!isLoaded || !incomeLoaded) {
    return <CropDetailSkeleton />;
  }

  if (!cropMeta) {
    return (
      <div className="space-y-4">
        <Link href="/crops" className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Crops
        </Link>
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center">
          <h2 className="font-display font-semibold text-ink mb-1">Crop not found</h2>
          <p className="text-sm text-ink-muted">&quot;{cropParam}&quot; isn&apos;t a crop KhetiBahi tracks.</p>
        </div>
      </div>
    );
  }

  const income$ = pl?.income ?? 0;
  const expense$ = pl?.expense ?? 0;
  const profit$ = pl?.profit ?? 0;
  const qty = pl?.quantitySoldKg ?? 0;
  const due$ = pl?.amountDue ?? 0;
  const isProfit = profit$ >= 0;
  const cropLabel = `${cropMeta.emoji} ${cropMeta.label}`;

  function handleExportAllBuyers() {
    const records = cropIncome.map((inc) => ({
      id: inc.id,
      date: inc.date,
      crop: inc.crop,
      buyer: inc.buyer,
      quantityKg: inc.quantityKg,
      ratePerKg: inc.ratePerKg,
      amount: inc.quantityKg * inc.ratePerKg,
      amountPaid: inc.amountPaid,
      note: inc.note,
    }));
    exportCropBuyersToPDF(cropLabel, records);
  }

  return (
    <div className="space-y-5">
      {/* Back link + header */}
      <div className="space-y-2">
        <Link href="/crops" className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Crops
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-2xl text-2xl flex-shrink-0 bg-brand-soft">
            {cropMeta.emoji}
          </span>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">{cropMeta.label}</h1>
            <p className="text-sm text-ink-muted">
              {qty > 0 ? `${qty}kg sold across ${cropIncome.length} sale${cropIncome.length === 1 ? "" : "s"}` : "No sales logged yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-brand-soft">
            <Coins className="w-5 h-5 text-brand" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand mb-0.5">Earned</p>
            <p className="text-base font-display font-bold text-ink tabular-nums truncate">{formatNPR(income$)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-negative-soft">
            <Wallet className="w-5 h-5 text-negative" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-negative mb-0.5">Spent</p>
            <p className="text-base font-display font-bold text-ink tabular-nums truncate">{formatNPR(expense$)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-accent-soft">
            <Clock3 className="w-5 h-5 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent mb-0.5">Due</p>
            <p className="text-base font-display font-bold text-ink tabular-nums truncate">{formatNPR(due$)}</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-soft flex items-start gap-3 min-w-0 ${isProfit ? "bg-brand-soft border-brand/20" : "bg-negative-soft border-negative/20"}`}>
          <span className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${isProfit ? "bg-brand text-white" : "bg-negative text-white"}`}>
            {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <p className={`text-xs font-medium mb-0.5 ${isProfit ? "text-brand-dark" : "text-negative"}`}>
              {isProfit ? "Profit" : "Loss"}
            </p>
            <p className="text-base font-display font-bold text-ink tabular-nums truncate">{formatNPR(Math.abs(profit$))}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales for this crop */}
        <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line gap-2 flex-wrap">
            <h2 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-ink-faint" />
              Sales
            </h2>
            <div className="flex items-center gap-3 flex-shrink-0">
              {cropIncome.length > 0 && (
                <button
                  onClick={handleExportAllBuyers}
                  className="flex items-center gap-1 text-xs text-ink-muted font-medium hover:text-brand hover:underline"
                  title="Export every buyer's history for this crop as one PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export All
                </button>
              )}
              <button
                onClick={() => setBuyerHistoryOpen(true)}
                className="flex items-center gap-1 text-xs text-ink-muted font-medium hover:text-brand hover:underline"
              >
                <Users className="w-3.5 h-3.5" />
                Buyer History
              </button>
              <Link href="/income" className="flex items-center gap-1 text-xs text-brand font-medium hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Log Sale
              </Link>
            </div>
          </div>
          {cropIncome.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="w-7 h-7 text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-muted">No sales logged for {cropMeta.label.toLowerCase()} yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[420px] overflow-y-auto">
              {cropIncome.map((inc) => {
                const total = inc.quantityKg * inc.ratePerKg;
                const due = amountDueFor(inc);
                const status = getPaymentStatus(inc);
                const meta = STATUS_META[status];
                const StatusIcon = meta.Icon;
                return (
                  <div key={inc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{inc.buyer}</p>
                      <p className="text-xs text-ink-muted tabular-nums">
                        {prettyDate(inc.date)} · {inc.quantityKg}kg × {formatNPR(inc.ratePerKg)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-brand tabular-nums">{formatNPR(total)}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${meta.bg} ${meta.text}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {meta.label}
                      </span>
                      {due > 0 && <p className="text-[11px] text-ink-faint tabular-nums mt-0.5">{formatNPR(due)} due</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expenses for this crop */}
        <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
            <h2 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-ink-faint" />
              Expenses
            </h2>
            <Link href="/expenses" className="flex items-center gap-1 text-xs text-brand font-medium hover:underline">
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </Link>
          </div>
          {cropExpenses.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="w-7 h-7 text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-muted">No expenses tagged to {cropMeta.label.toLowerCase()} yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[420px] overflow-y-auto">
              {cropExpenses.map((exp) => {
                const cat = CATEGORIES.find((c) => c.value === exp.category);
                return (
                  <div key={exp.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cat?.bg ?? "bg-gray-100"} ${cat?.text ?? "text-gray-700"}`}>
                        {exp.category}
                      </span>
                      <p className="text-xs text-ink-muted mt-1 tabular-nums">{prettyDate(exp.date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-negative tabular-nums flex-shrink-0">
                      −{formatNPR(exp.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {expense$ > 0 && (
        <p className="text-xs text-ink-faint text-center">
          Note: general farm expenses tagged &quot;All Crops&quot; aren&apos;t counted here — only costs tagged specifically to {cropMeta.label.toLowerCase()}.
        </p>
      )}

      {/* Modal: crop-scoped buyer history + single-buyer PDF export */}
      {buyerHistoryOpen && (
        <CropBuyerHistoryModal
          crop={cropParam}
          cropLabel={cropLabel}
          onClose={() => setBuyerHistoryOpen(false)}
        />
      )}
    </div>
  );
}
