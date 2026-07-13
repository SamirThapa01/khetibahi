// ─────────────────────────────────────────────
//  KhetiBahi – Utility Functions
//  Pure functions with no side effects.
//  Easy to test and reuse anywhere.
// ─────────────────────────────────────────────

import {
  Expense,
  Income,
  CategorySummary,
  MonthlySummary,
  CropProfitLoss,
  PaymentStatus,
  PaymentStatusSummary,
  BuyerDue,
} from "@/app/types";
import { CATEGORIES, CROPS } from "./constants";
import { format, parseISO, startOfMonth } from "date-fns";

// NOTE: data now lives in MongoDB (see app/hooks/useExpenses.ts and
// useIncome.ts, which call the /api/expenses and /api/income routes).
// The old localStorage load/save helpers and generateId() were removed —
// MongoDB now generates each document's unique _id for us.

// ── Number / currency formatting ─────────────

/** Format a number as NPR rupees: ₹ 1,24,000 */
export function formatNPR(amount: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Aggregation helpers ───────────────────────

/** Compute per-category totals for a given list of expenses */
export function buildCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const totals: Record<string, { total: number; count: number }> = {};

  for (const exp of expenses) {
    if (!totals[exp.category]) totals[exp.category] = { total: 0, count: 0 };
    totals[exp.category].total += exp.amount;
    totals[exp.category].count += 1;
  }

  return CATEGORIES.map((cat) => ({
    category: cat.value,
    total: totals[cat.value]?.total ?? 0,
    count: totals[cat.value]?.count ?? 0,
    color: cat.bg,
  })).sort((a, b) => b.total - a.total);
}

/**
 * Same output shape as buildCategorySummaries(), but starting from
 * pre-aggregated {category, total, count} totals (from the
 * /api/expenses/summary MongoDB aggregation) instead of a raw Expense[].
 * Used by the Expenses page's table hook, which only ever holds one
 * page (10 rows) in memory — so category totals must come pre-summed
 * from the server instead of being reduced client-side.
 */
export function buildCategorySummariesFromTotals(
  categoryTotals: { category: string; total: number; count: number }[]
): CategorySummary[] {
  const totals: Record<string, { total: number; count: number }> = {};
  for (const c of categoryTotals) {
    totals[c.category] = { total: c.total, count: c.count };
  }

  return CATEGORIES.map((cat) => ({
    category: cat.value,
    total: totals[cat.value]?.total ?? 0,
    count: totals[cat.value]?.count ?? 0,
    color: cat.bg,
  })).sort((a, b) => b.total - a.total);
}

/** Group expenses into monthly summaries, sorted newest-first */
export function buildMonthlySummaries(expenses: Expense[]): MonthlySummary[] {
  const map: Record<string, MonthlySummary> = {};

  for (const exp of expenses) {
    const key = format(startOfMonth(parseISO(exp.date)), "MMM yyyy");
    if (!map[key]) {
      map[key] = { month: key, total: 0, categories: {} as MonthlySummary["categories"] };
    }
    map[key].total += exp.amount;
    map[key].categories[exp.category] = (map[key].categories[exp.category] ?? 0) + exp.amount;
  }

  return Object.values(map).sort((a, b) => {
    // Sort descending by date (parse "Jan 2025" back for comparison)
    return new Date(b.month).getTime() - new Date(a.month).getTime();
  });
}

/** Grand total from an array of expenses */
export function grandTotal(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

/** Total earned from an array of income/sale records (rate × kg, regardless of paid/due) */
export function grandIncomeTotal(income: Income[]): number {
  return income.reduce((acc, i) => acc + i.ratePerKg * i.quantityKg, 0);
}

/** Total still owed by buyers across all sales ("amount due") */
export function totalAmountDue(income: Income[]): number {
  return income.reduce((acc, i) => acc + (i.ratePerKg * i.quantityKg - i.amountPaid), 0);
}

/**
 * Derive a sale's payment status straight from its numbers.
 * Never stored — always computed — so it can never go stale.
 */
export function getPaymentStatus(inc: Pick<Income, "amountPaid" | "quantityKg" | "ratePerKg">): PaymentStatus {
  const total = inc.quantityKg * inc.ratePerKg;
  if (inc.amountPaid <= 0) return "Due";
  if (inc.amountPaid >= total) return "Paid";
  return "Partial";
}

/** How much of a sale is still outstanding (never negative) */
export function amountDueFor(inc: Pick<Income, "amountPaid" | "quantityKg" | "ratePerKg">): number {
  return Math.max(inc.quantityKg * inc.ratePerKg - inc.amountPaid, 0);
}

/** Roll income up into Paid / Partial / Due buckets — powers the Income page stat card and the Analytics payment chart */
export function buildPaymentStatusSummary(income: Income[]): PaymentStatusSummary[] {
  const buckets: Record<PaymentStatus, { total: number; count: number }> = {
    Paid: { total: 0, count: 0 },
    Partial: { total: 0, count: 0 },
    Due: { total: 0, count: 0 },
  };

  for (const inc of income) {
    const status = getPaymentStatus(inc);
    buckets[status].total += inc.ratePerKg * inc.quantityKg;
    buckets[status].count += 1;
  }

  return (["Paid", "Partial", "Due"] as PaymentStatus[]).map((status) => ({
    status,
    total: buckets[status].total,
    count: buckets[status].count,
  }));
}

/**
 * Group every sale with money still outstanding by buyer + crop, so the
 * farmer can see exactly who owes what — sorted by the biggest due amount
 * first. Powers the "Outstanding Dues" list in Analytics.
 */
export function buildBuyerDues(income: Income[]): BuyerDue[] {
  const map: Record<string, BuyerDue> = {};

  for (const inc of income) {
    const due = amountDueFor(inc);
    if (due <= 0) continue;

    const key = `${inc.buyer.trim().toLowerCase()}|${inc.crop}`;
    if (!map[key]) {
      map[key] = {
        buyer: inc.buyer,
        crop: inc.crop,
        totalDue: 0,
        saleCount: 0,
        oldestDueDate: inc.date,
      };
    }
    map[key].totalDue += due;
    map[key].saleCount += 1;
    if (inc.date < map[key].oldestDueDate) map[key].oldestDueDate = inc.date;
  }

  return Object.values(map).sort((a, b) => b.totalDue - a.totalDue);
}

/**
 * Build profit/loss per crop.
 *
 * Income for a crop = sum of (rate × kg) for every sale of that crop.
 * Expense for a crop = sum of expense amounts tagged to that exact crop.
 *   NOTE: expenses tagged "All Crops" (general farm costs not tied to
 *   one crop) are intentionally EXCLUDED here, so per-crop numbers stay
 *   clean. They still count in the overall farm total elsewhere.
 * Profit = income - expense. Negative means a loss on that crop.
 */
export function buildCropProfitLoss(expenses: Expense[], income: Income[]): CropProfitLoss[] {
  const cropNames = CROPS.filter((c) => c.value !== "All Crops").map((c) => c.value);

  return cropNames.map((crop) => {
    const cropIncome = income.filter((i) => i.crop === crop);
    const cropExpenses = expenses.filter((e) => e.crop === crop);

    const incomeTotal = grandIncomeTotal(cropIncome);
    const expenseTotal = grandTotal(cropExpenses);
    const quantitySoldKg = cropIncome.reduce((acc, i) => acc + i.quantityKg, 0);
    const amountDue = totalAmountDue(cropIncome);

    return {
      crop: crop as CropProfitLoss["crop"],
      income: incomeTotal,
      expense: expenseTotal,
      profit: incomeTotal - expenseTotal,
      quantitySoldKg,
      amountDue,
    };
  });
}

/**
 * Build monthly income vs. expense totals, oldest → newest, for the
 * dashboard's cash flow chart. Limited to the most recent `months`
 * calendar months (default 6) so the chart stays readable.
 */
export function buildCashFlowSummaries(
  expenses: Expense[],
  income: Income[],
  months: number = 6
): { month: string; income: number; expense: number }[] {
  const map: Record<string, { sortKey: string; income: number; expense: number }> = {};

  function bucketKey(dateStr: string): { label: string; sortKey: string } {
    const d = startOfMonth(parseISO(dateStr));
    return { label: format(d, "MMM yyyy"), sortKey: format(d, "yyyy-MM") };
  }

  for (const e of expenses) {
    const { label, sortKey } = bucketKey(e.date);
    if (!map[label]) map[label] = { sortKey, income: 0, expense: 0 };
    map[label].expense += e.amount;
  }

  for (const i of income) {
    const { label, sortKey } = bucketKey(i.date);
    if (!map[label]) map[label] = { sortKey, income: 0, expense: 0 };
    map[label].income += i.ratePerKg * i.quantityKg;
  }

  return Object.entries(map)
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .slice(-months)
    .map(([month, v]) => ({ month, income: v.income, expense: v.expense }));
}

// ── CSV Export ────────────────────────────────

/** Convert expenses to a CSV string and trigger a browser download */
export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Category", "Crop", "Amount (NPR)", "Note"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.crop,
    e.amount.toString(),
    `"${e.note.replace(/"/g, '""')}"`, // escape quotes
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `khetibahi_expenses_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Convert income/sale records to a CSV string and trigger a browser download */
export function exportIncomeToCSV(income: Income[]): void {
  const headers = ["Date", "Crop", "Buyer", "Quantity (kg)", "Rate/kg (NPR)", "Total (NPR)", "Paid (NPR)", "Due (NPR)", "Note"];
  const rows = income.map((i) => {
    const total = i.ratePerKg * i.quantityKg;
    const due = total - i.amountPaid;
    return [
      i.date,
      i.crop,
      `"${i.buyer.replace(/"/g, '""')}"`,
      i.quantityKg.toString(),
      i.ratePerKg.toString(),
      total.toString(),
      i.amountPaid.toString(),
      due.toString(),
      `"${i.note.replace(/"/g, '""')}"`,
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `khetibahi_income_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Date helpers ──────────────────────────────

/** "2025-04-15" → "Apr 15, 2025" */
export function prettyDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}

/** Today as "YYYY-MM-DD" (used as default date in the form) */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export interface OutstandingDue {
  incomeId: string;
  buyer: string;
  crop: string;
  totalValue: number;
  amountPaid: number;
  amountDue: number;
  saleDate: string;
  daysSince: number;
  isOverdue: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getOutstandingDues(
  income: Income[],
  overdueThresholdDays = 14
): OutstandingDue[] {
  const today = new Date();

  return income
    .map((sale) => {
      const totalValue = sale.ratePerKg * sale.quantityKg;
      const amountDue = totalValue - sale.amountPaid;
      const saleDate = new Date(sale.date);
      const daysSince = Math.floor((today.getTime() - saleDate.getTime()) / MS_PER_DAY);

      return {
        incomeId: sale._id,
        buyer: sale.buyer,
        crop: sale.crop,
        totalValue,
        amountPaid: sale.amountPaid,
        amountDue,
        saleDate: sale.date,
        daysSince,
        isOverdue: daysSince >= overdueThresholdDays,
      };
    })
    .filter((d) => d.amountDue > 0)
    .sort((a, b) => b.daysSince - a.daysSince);
}

export function buildSeasonProfitLoss(expenses: Expense[], income: Income[]) {
  const seasons = new Set<string>([
    ...expenses.map((e) => e.season).filter((s): s is string => !!s),
    ...income.map((i) => i.season).filter((s): s is string => !!s),
  ]);

  return Array.from(seasons).map((season) => {
    const seasonIncome = income
      .filter((i) => i.season === season)
      .reduce((sum, i) => sum + i.ratePerKg * i.quantityKg, 0);

    const seasonExpense = expenses
      .filter((e) => e.season === season)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      season,
      income: seasonIncome,
      expense: seasonExpense,
      profit: seasonIncome - seasonExpense,
    };
  });
}
