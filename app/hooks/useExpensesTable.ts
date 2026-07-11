// ─────────────────────────────────────────────
//  KhetiBahi – useExpensesTable Hook
//
//  Powers ONLY the Expenses page's table + pagination controls.
//  This is deliberately a SEPARATE hook from useExpenses() (used by
//  the dashboard, Crops pages, and Analytics), because those pages
//  need the complete expense list to compute cross-page totals —
//  pagination there would silently break their math. This hook is
//  scoped to exactly the one page that asked for pagination.
//
//  What it does:
//    • asks /api/expenses/list for ONE page at a time (10 rows,
//      already filtered + sorted by the server)
//    • asks /api/expenses/summary for category totals / grand total
//      (a MongoDB aggregation, so correct regardless of which page
//      you're viewing — not derived from the 10 rows in memory)
//    • sends every add/edit/delete straight to the server, then
//      refreshes both the current page and the summary
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Expense, ExpenseFormData, CategorySummary } from "@/app/types";
import { buildCategorySummariesFromTotals } from "@/app/utils/helpers";
import { useInformation } from "../components/Information";
import type { ExpenseFilters } from "./useExpenses"; // same shape FilterBar already expects

const PAGE_SIZE = 10;

const DEFAULT_FILTERS: ExpenseFilters = {
  category: "All",
  crop: "All",
  month: "",
  search: "",
};

function buildQuery(filters: ExpenseFilters, page: number, limit: number | "all") {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filters.category !== "All") params.set("category", filters.category);
  if (filters.crop !== "All") params.set("crop", filters.crop);
  if (filters.month) params.set("month", filters.month);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

export function useExpensesTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]); // current PAGE only (max 10)
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useInformation();

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters: ExpenseFilters = { ...filters, search: debouncedSearch };

  // Any filter change resets to page 1 — otherwise you could be stuck on
  // "page 4" of a filtered set that now only has 1 page. This runs during
  // render (React's documented "adjust state while rendering" pattern)
  // instead of in a useEffect, so it doesn't trigger an extra render pass.
  const filterKey = JSON.stringify(effectiveFilters);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const fetchIdRef = useRef(0);
  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    (async () => {
      try {
        const res = await fetch(`/api/expenses/list?${buildQuery(effectiveFilters, page, PAGE_SIZE)}`);
        if (!res.ok) throw new Error("Could not load expenses.");
        const body = await res.json();
        if (fetchIdRef.current !== thisFetchId) return; // a newer request already won
        setExpenses(body.data);
        setTotal(body.total);
        setTotalPages(body.totalPages);
        setFilteredTotal(body.filteredTotal);
        setError(null);
      } catch (err) {
        console.error(err);
        if (fetchIdRef.current === thisFetchId) setError("Could not load expenses. Please refresh.");
      } finally {
        if (fetchIdRef.current === thisFetchId) setIsLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, effectiveFilters.category, effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses/summary");
      if (!res.ok) throw new Error("Could not load summary.");
      const body = await res.json();
      setCategorySummaries(buildCategorySummariesFromTotals(body.categoryTotals));
      setTotalSpend(body.totalSpend);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch the summary once on mount — an inline IIFE, same pattern as the
  // page-fetch effect above, rather than calling fetchSummary() as a
  // function reference (keeps this readable as "an effect that fetches").
  useEffect(() => {
    (async () => {
      await fetchSummary();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchPage = useCallback(async () => {
    const res = await fetch(`/api/expenses/list?${buildQuery(effectiveFilters, page, PAGE_SIZE)}`);
    if (!res.ok) return;
    const body = await res.json();
    setExpenses(body.data);
    setTotal(body.total);
    setTotalPages(body.totalPages);
    setFilteredTotal(body.filteredTotal);
    if (body.data.length === 0 && page > 1) setPage((p) => p - 1); // delete emptied the last page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, effectiveFilters.category, effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search]);

  const addExpense = useCallback(async (data: ExpenseFormData): Promise<void> => {
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
      setError(null);
      show("success", "Expense added");
      setPage(1); // new row sorts newest-first, so it'll land on page 1
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save expense.");
    }
  }, [show, refetchPage, fetchSummary]);

  const updateExpense = useCallback(async (id: string, data: ExpenseFormData): Promise<void> => {
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
      setError(null);
      show("success", "Expense updated");
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update expense.");
    }
  }, [show, refetchPage, fetchSummary]);

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not delete expense");
        throw new Error(body.error ?? "Could not delete expense.");
      }
      setError(null);
      show("success", "Expense deleted");
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not delete expense.");
    }
  }, [show, refetchPage, fetchSummary]);

  /** Every matching row in one request — used only for CSV export, never for the table */
  const fetchAllForExport = useCallback(async (): Promise<Expense[]> => {
    const res = await fetch(`/api/expenses/list?${buildQuery(effectiveFilters, 1, "all")}`);
    if (!res.ok) return [];
    const body = await res.json();
    return body.data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFilters.category, effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search]);

  function setFilter<K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    expenses, // current PAGE only (max 10 rows)
    categorySummaries,
    totalSpend,
    isLoaded,
    error,

    page,
    setPage,
    totalPages,
    total,
    filteredTotal,
    pageSize: PAGE_SIZE,

    addExpense,
    updateExpense,
    deleteExpense,
    fetchAllForExport,

    filters,
    setFilter,
    resetFilters,
  };
}