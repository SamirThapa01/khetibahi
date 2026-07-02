// ─────────────────────────────────────────────
//  KhetiBahi – useExpenses Hook
//
//  This is the "brain" of the app.
//  Every component that needs expense data
//  calls this one hook. It:
//    • loads from the API (→ MongoDB) on mount
//    • sends every add/edit/delete straight to
//      the server, which is the single source
//      of truth (no more localStorage)
//    • exposes add / edit / delete actions
//    • returns filtered + computed summaries
//
//  Note: every fetch() call below automatically
//  sends the httpOnly auth cookie along with the
//  request (browsers do this by default for
//  same-origin requests) — that's how the API
//  route knows WHICH user's expenses to return.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Expense, ExpenseFormData, ExpenseCategory, CropType } from "@/app/types";
import { buildCategorySummaries, buildMonthlySummaries, grandTotal } from "@/app/utils/helpers";

/** What callers can control via filters */
export interface ExpenseFilters {
  category: ExpenseCategory | "All";
  crop: CropType | "All Crops" | "All";
  month: string;   // "YYYY-MM" or "" for all
  search: string;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  category: "All",
  crop: "All",
  month: "",
  search: "",
};

export function useExpenses() {
  // ── Raw state ──────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load from the database once on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/expenses");
        if (!res.ok) throw new Error("Could not load expenses.");
        const data: Expense[] = await res.json();
        if (!cancelled) setExpenses(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load expenses. Please refresh.");
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── CRUD actions ───────────────────────────

  /** Add a brand-new expense — saved to MongoDB immediately */
  const addExpense = useCallback(async (data: ExpenseFormData): Promise<void> => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save expense.");
      }
      const saved: Expense = await res.json();
      setExpenses((prev) => [saved, ...prev]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save expense.");
    }
  }, []);

  /** Update an existing expense (matched by id) */
  const updateExpense = useCallback(async (id: string, data: ExpenseFormData): Promise<void> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update expense.");
      }
      const updated: Expense = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update expense.");
    }
  }, []);

  /** Remove an expense permanently */
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not delete expense.");
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not delete expense.");
    }
  }, []);

  // ── Filtering ─────────────────────────────

  /** Apply current filters to the raw list */
  const filteredExpenses = useMemo<Expense[]>(() => {
    return expenses.filter((e) => {
      if (filters.category !== "All" && e.category !== filters.category) return false;
      if (filters.crop !== "All" && e.crop !== filters.crop) return false;
      if (filters.month && !e.date.startsWith(filters.month)) return false;
      if (
        filters.search &&
        !e.note.toLowerCase().includes(filters.search.toLowerCase()) &&
        !e.category.toLowerCase().includes(filters.search.toLowerCase()) &&
        !e.crop.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [expenses, filters]);

  // ── Derived summaries (always from full list) ─
  const categorySummaries = useMemo(() => buildCategorySummaries(expenses), [expenses]);
  const monthlySummaries  = useMemo(() => buildMonthlySummaries(expenses),  [expenses]);
  const totalSpend        = useMemo(() => grandTotal(expenses), [expenses]);

  // ── Filter setter helpers ──────────────────
  function setFilter<K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    // data
    expenses,           // raw, unfiltered
    filteredExpenses,   // after applying filters
    categorySummaries,
    monthlySummaries,
    totalSpend,
    isLoaded,
    error,

    // actions
    addExpense,
    updateExpense,
    deleteExpense,

    // filters
    filters,
    setFilter,
    resetFilters,
  };
}
