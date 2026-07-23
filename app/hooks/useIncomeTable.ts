// ─────────────────────────────────────────────
//  KhetiBahi – useIncomeTable Hook
//
//  Powers ONLY the Income page's table + pagination controls, for the
//  same reason as useExpensesTable: the dashboard, Crops pages, and
//  Analytics still need the FULL sales history via useIncome(), so
//  this pagination logic lives in its own hook instead of changing
//  what everyone else depends on.
//
//  Offline queue: reconciliation here just refetches the current page
//  + summary once a queued mutation actually reaches the server,
//  rather than trying to splice a temp record into an arbitrary page
//  (a new record always belongs on page 1 of the default sort, an
//  edited/deleted one could be on any page depending on filters) —
//  same "just refetch, trust the server" approach useBudgets.ts uses.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Income, IncomeFormData, PaymentStatusSummary } from "@/app/types";
import { useInformation } from "../components/Information";
import type { IncomeFilters } from "./useIncome"; // same shape IncomeFilterBar already expects
import { useOfflineQueue } from "./useOfflineQueue";
import { QueuedMutation, updateQueuedCreateBody, removeQueuedCreate } from "@/lib/offlineQueue";

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

  // ── Offline queue ───────────────────────────
  // Once a queued mutation actually reaches the server, refetch this page
  // + the summary rather than trying to reconcile one record in place —
  // simplest correct thing for a paginated view (see file header).
  const handleApplied = useCallback(
    async (mutation: QueuedMutation, res: Response | null, err: unknown) => {
      if (err || !res) return; // network still down; stays queued, retried next reconnect
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", `Could not sync "${mutation.label}": ${body.error ?? "server rejected it"}`);
        await Promise.all([refetchPage(), fetchSummary()]);
        return;
      }
      show("success", `Synced: ${mutation.label}`);
      await Promise.all([refetchPage(), fetchSummary()]);
    },
    [show, refetchPage, fetchSummary]
  );

  const { isOnline, pendingCount, enqueue } = useOfflineQueue("income", handleApplied);

  const addIncome = useCallback(async (data: IncomeFormData): Promise<void> => {
    if (!isOnline) {
      const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const optimistic: Income = { ...data, id: tempId, createdAt: new Date().toISOString() };
      // A new record always sorts newest-first onto page 1 — only show it
      // immediately if that's the page currently on screen, so we never
      // inject a row into the middle of some other page's real results.
      if (page === 1) {
        setIncome((prev) => [optimistic, ...prev].slice(0, PAGE_SIZE));
        setTotal((t) => t + 1);
        setFilteredTotal((t) => t + 1);
      }
      enqueue({
        method: "POST",
        url: "/api/income",
        body: data,
        label: `Add income: ${data.crop} — ${data.buyer}`,
        tempId,
      });
      show("info", "No connection — saved on this device, will sync once you're back online");
      return;
    }
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
  }, [isOnline, enqueue, page, show, refetchPage, fetchSummary]);

  const updateIncome = useCallback(async (id: string, data: IncomeFormData): Promise<void> => {
    if (!isOnline) {
      // If this record itself hasn't synced yet (still a temp offline id),
      // there's no server-side record to PUT against — just patch the
      // still-queued POST in place instead of enqueueing a second mutation.
      if (id.startsWith("offline-")) {
        updateQueuedCreateBody(id, data);
        setIncome((prev) => prev.map((i) => (i.id === id ? { ...data, id, createdAt: i.createdAt } : i)));
        return;
      }
      setIncome((prev) => prev.map((i) => (i.id === id ? { ...data, id, createdAt: i.createdAt } : i)));
      enqueue({
        method: "PUT",
        url: `/api/income/${id}`,
        body: data,
        label: `Update income: ${data.crop} — ${data.buyer}`,
        targetId: id,
      });
      show("info", "No connection — saved on this device, will sync once you're back online");
      return;
    }
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
  }, [isOnline, enqueue, show, refetchPage, fetchSummary]);

  const deleteIncome = useCallback(async (id: string): Promise<void> => {
    if (!isOnline) {
      if (id.startsWith("offline-")) {
        // Never left the device — just drop the queued create, nothing to sync.
        removeQueuedCreate(id);
        setIncome((prev) => prev.filter((i) => i.id !== id));
        show("info", "Removed (was never synced)");
        return;
      }
      setIncome((prev) => prev.filter((i) => i.id !== id));
      enqueue({
        method: "DELETE",
        url: `/api/income/${id}`,
        label: "Delete income record",
        targetId: id,
      });
      show("info", "No connection — will delete once you're back online");
      return;
    }
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
  }, [isOnline, enqueue, show, refetchPage, fetchSummary]);

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
    isOnline,
    pendingCount,

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