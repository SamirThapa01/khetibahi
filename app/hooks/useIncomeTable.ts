// ─────────────────────────────────────────────
//  KhetiBahi – useIncomeTable Hook
//
//  Powers ONLY the Income page's table + pagination controls, for the
//  same reason as useExpensesTable: the dashboard, Crops pages, and
//  Analytics still need the FULL sales history via useIncome(), so
//  this pagination logic lives in its own hook instead of changing
//  what everyone else depends on.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Income, IncomeFormData, PaymentStatusSummary } from "@/app/types";
import { useInformation } from "../components/Information";
import type { IncomeFilters } from "./useIncome"; // same shape IncomeFilterBar already expects

const PAGE_SIZE = 10;

const DEFAULT_FILTERS: IncomeFilters = {
  crop: "All",
  month: "",
  search: "",
  status: "All",
};

function buildQuery(filters: IncomeFilters, page: number, limit: number | "all") {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filters.crop !== "All") params.set("crop", filters.crop);
  if (filters.month) params.set("month", filters.month);
  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "All") params.set("status", filters.status);
  return params.toString();
}

export function useIncomeTable() {
  const [income, setIncome] = useState<Income[]>([]); // current PAGE only (max 10)
  const [filters, setFilters] = useState<IncomeFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useInformation();

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [statusSummary, setStatusSummary] = useState<PaymentStatusSummary[]>([]);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters: IncomeFilters = { ...filters, search: debouncedSearch };

  // Any filter change resets to page 1. Done during render (React's
  // documented "adjust state while rendering" pattern) rather than in a
  // useEffect, so it doesn't cost an extra render pass.
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
        const res = await fetch(`/api/income/list?${buildQuery(effectiveFilters, page, PAGE_SIZE)}`);
        if (!res.ok) throw new Error("Could not load income.");
        const body = await res.json();
        if (fetchIdRef.current !== thisFetchId) return;
        setIncome(body.data);
        setTotal(body.total);
        setTotalPages(body.totalPages);
        setFilteredTotal(body.filteredTotal);
        setError(null);
      } catch (err) {
        console.error(err);
        if (fetchIdRef.current === thisFetchId) setError("Could not load income. Please refresh.");
      } finally {
        if (fetchIdRef.current === thisFetchId) setIsLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search, effectiveFilters.status]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/income/summary");
      if (!res.ok) throw new Error("Could not load summary.");
      const body = await res.json();
      setTotalIncome(body.totalIncome);
      setTotalDue(body.totalDue);
      setStatusSummary(body.statusSummary);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch the summary once on mount — inline IIFE, matching the page-fetch
  // effect above, rather than calling fetchSummary() as a bare reference.
  useEffect(() => {
    (async () => {
      await fetchSummary();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchPage = useCallback(async () => {
    const res = await fetch(`/api/income/list?${buildQuery(effectiveFilters, page, PAGE_SIZE)}`);
    if (!res.ok) return;
    const body = await res.json();
    setIncome(body.data);
    setTotal(body.total);
    setTotalPages(body.totalPages);
    setFilteredTotal(body.filteredTotal);
    if (body.data.length === 0 && page > 1) setPage((p) => p - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search, effectiveFilters.status]);

  const addIncome = useCallback(async (data: IncomeFormData): Promise<void> => {
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not save income");
        throw new Error(body.error ?? "Could not save income.");
      }
      setError(null);
      show("success", "Income added");
      setPage(1);
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save income.");
    }
  }, [show, refetchPage, fetchSummary]);

  const updateIncome = useCallback(async (id: string, data: IncomeFormData): Promise<void> => {
    try {
      const res = await fetch(`/api/income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not update income");
        throw new Error(body.error ?? "Could not update income.");
      }
      setError(null);
      show("success", "Income updated");
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update income.");
    }
  }, [show, refetchPage, fetchSummary]);

  const deleteIncome = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", body.error ?? "Could not delete income");
        throw new Error(body.error ?? "Could not delete income.");
      }
      setError(null);
      show("success", "Income deleted");
      await Promise.all([refetchPage(), fetchSummary()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not delete income.");
    }
  }, [show, refetchPage, fetchSummary]);

  /**
   * Quick "Record Payment" action. Needs the full record to compute the
   * new amountPaid — it reads from whatever's on the current in-memory
   * page, which is safe because the button that triggers this only
   * exists on rows that are already rendered.
   */
  const recordPayment = useCallback(
    async (id: string, extraPaid: number): Promise<void> => {
      const target = income.find((i) => i.id === id);
      if (!target) return;
      const total = target.quantityKg * target.ratePerKg;
      const newAmountPaid = Math.min(total, target.amountPaid + extraPaid);
      await updateIncome(id, {
        date: target.date,
        crop: target.crop,
        buyer: target.buyer,
        quantityKg: target.quantityKg,
        ratePerKg: target.ratePerKg,
        amountPaid: newAmountPaid,
        note: target.note,
      });
    },
    [income, updateIncome]
  );

  /** Every matching row in one request — used only for CSV export, never for the table */
  const fetchAllForExport = useCallback(async (): Promise<Income[]> => {
    const res = await fetch(`/api/income/list?${buildQuery(effectiveFilters, 1, "all")}`);
    if (!res.ok) return [];
    const body = await res.json();
    return body.data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFilters.crop, effectiveFilters.month, effectiveFilters.search, effectiveFilters.status]);

  function setFilter<K extends keyof IncomeFilters>(key: K, value: IncomeFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    income, // current PAGE only (max 10 rows)
    totalIncome,
    totalDue,
    statusSummary,
    isLoaded,
    error,

    page,
    setPage,
    totalPages,
    total,
    filteredTotal,
    pageSize: PAGE_SIZE,

    addIncome,
    updateIncome,
    deleteIncome,
    recordPayment,
    fetchAllForExport,

    filters,
    setFilter,
    resetFilters,
  };
}