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
import { useInformation } from "../components/Information";
import { useOfflineQueue } from "./useOfflineQueue";
import { QueuedMutation, updateQueuedCreateBody, removeQueuedCreate } from "@/lib/offlineQueue";


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
  const { show } = useInformation();

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

  // ── Offline queue ───────────────────────────
  const handleApplied = useCallback(
    async (mutation: QueuedMutation, res: Response | null, err: unknown) => {
      if (err || !res) return; // network still down; stays queued, retried next reconnect
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", `Could not sync "${mutation.label}": ${body.error ?? "server rejected it"}`);
        if (mutation.method === "POST" && mutation.tempId) {
          setExpenses((prev) => prev.filter((e) => e.id !== mutation.tempId));
        }
        return;
      }
      if (mutation.method === "POST" && mutation.tempId) {
        const saved: Expense = await res.json();
        setExpenses((prev) => prev.map((e) => (e.id === mutation.tempId ? saved : e)));
      } else if (mutation.method === "PUT" && mutation.targetId) {
        const updated: Expense = await res.json();
        setExpenses((prev) => prev.map((e) => (e.id === mutation.targetId ? updated : e)));
      }
      show("success", `Synced: ${mutation.label}`);
    },
    [show]
  );

  const { isOnline, pendingCount, enqueue } = useOfflineQueue("expenses", handleApplied);

  // ── CRUD actions ───────────────────────────

  /** Add a brand-new expense — saved to MongoDB immediately */
  const addExpense = useCallback(async (data: ExpenseFormData): Promise<void> => {
    if (!isOnline) {
      const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const optimistic: Expense = { ...data, id: tempId, createdAt: new Date().toISOString() };
      setExpenses((prev) => [optimistic, ...prev]);
      enqueue({
        method: "POST",
        url: "/api/expenses",
        body: data,
        label: `Add expense: ${data.category} (${data.crop})`,
        tempId,
      });
      show("info", "No connection — saved on this device, will sync once you're back online");
      return;
    }
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not add expense");
        throw new Error(body.error ?? "Could not save expense.");
      }
      const saved: Expense = await res.json();
      setExpenses((prev) => [saved, ...prev]);
      setError(null);
      show("success", "Expense added");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save expense.");
    }
  }, [isOnline, enqueue, show]);

  /** Update an existing expense (matched by id) */
  const updateExpense = useCallback(async (id: string, data: ExpenseFormData): Promise<void> => {
    if (!isOnline) {
      if (id.startsWith("offline-")) {
        updateQueuedCreateBody(id, data);
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...data, id, createdAt: e.createdAt } : e)));
        return;
      }
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...data, id, createdAt: e.createdAt } : e)));
      enqueue({
        method: "PUT",
        url: `/api/expenses/${id}`,
        body: data,
        label: `Update expense: ${data.category} (${data.crop})`,
        targetId: id,
      });
      show("info", "No connection — saved on this device, will sync once you're back online");
      return;
    }
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not update expense");
        throw new Error(body.error ?? "Could not update expense.");
      }
      const updated: Expense = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setError(null);
      show("success", "Expense updated");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update expense.");
    }
  }, [isOnline, enqueue, show]);

  /** Remove an expense permanently */
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    if (!isOnline) {
      if (id.startsWith("offline-")) {
        removeQueuedCreate(id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        show("info", "Removed (was never synced)");
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      enqueue({
        method: "DELETE",
        url: `/api/expenses/${id}`,
        label: "Delete expense record",
        targetId: id,
      });
      show("info", "No connection — will delete once you're back online");
      return;
    }
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not delete expense");
        throw new Error(body.error ?? "Could not delete expense.");
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setError(null);
      show("success", "Expense deleted");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not delete expense.");
    }
  }, [isOnline, enqueue, show]);

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
    isOnline,
    pendingCount,

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