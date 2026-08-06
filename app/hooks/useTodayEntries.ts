// ─────────────────────────────────────────────
//  KhetiBahi – useTodayEntries Hook
//
//  Thin wrapper around GET /api/entries/today. Two callers:
//   - Dashboard's "Today's Entries" widget (no `date` → defaults to today,
//     refetches on an interval + exposes `refetch` for right after an add).
//   - IncomeForm / ExpenseForm's duplicate check (pass the form's own
//     `date`, refetch whenever that date changes).
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TodayIncomeEntry {
  id: string;
  date: string;
  crop: string;
  buyer: string;
  quantityKg: number;
  ratePerKg: number;
  amountPaid: number;
  note: string;
  createdAt: string;
}

export interface TodayExpenseEntry {
  id: string;
  date: string;
  category: string;
  crop: string;
  amount: number;
  note: string;
  createdAt: string;
}

export function useTodayEntries(date?: string, refreshSignal?: number) {
  const [income, setIncome] = useState<TodayIncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<TodayExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avoids setting state from a stale, slower request that resolves
  // after a newer one (e.g. the user flips the date field twice fast).
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`/api/entries/today${qs}`);
      if (!res.ok) throw new Error("Could not load today's entries.");
      const data: { income: TodayIncomeEntry[]; expenses: TodayExpenseEntry[] } = await res.json();
      if (id !== requestId.current) return; // superseded by a newer request
      setIncome(data.income);
      setExpenses(data.expenses);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error(err);
      setError("Could not load today's entries.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshSignal]);

  return { income, expenses, loading, error, refetch: load };
}
