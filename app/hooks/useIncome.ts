// ─────────────────────────────────────────────
//  KhetiBahi – useIncome Hook
//
//  Same pattern as useExpenses: loads from the
//  API (→ MongoDB) on mount, sends every
//  add/edit/delete straight to the server, and
//  exposes filtering + computed totals.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Income, IncomeFormData, CropType, PaymentStatus } from "@/app/types";
import { grandIncomeTotal, totalAmountDue, getPaymentStatus, buildPaymentStatusSummary } from "@/app/utils/helpers";

export interface IncomeFilters {
  crop: CropType | "All";
  month: string;   // "YYYY-MM" or "" for all
  search: string;  // matches buyer name or note
  status: PaymentStatus | "All"; // Paid / Partial / Due / All
}

const DEFAULT_FILTERS: IncomeFilters = {
  crop: "All",
  month: "",
  search: "",
  status: "All",
};

export function useIncome() {
  const [income, setIncome] = useState<Income[]>([]);
  const [filters, setFilters] = useState<IncomeFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load from the database once on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/income");
        if (!res.ok) throw new Error("Could not load income.");
        const data: Income[] = await res.json();
        if (!cancelled) setIncome(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load income. Please refresh.");
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── CRUD actions ───────────────────────────

  const addIncome = useCallback(async (data: IncomeFormData): Promise<void> => {
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save income.");
      }
      const saved: Income = await res.json();
      setIncome((prev) => [saved, ...prev]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save income.");
    }
  }, []);

  const updateIncome = useCallback(async (id: string, data: IncomeFormData): Promise<void> => {
    try {
      const res = await fetch(`/api/income/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update income.");
      }
      const updated: Income = await res.json();
      setIncome((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update income.");
    }
  }, []);

  const deleteIncome = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not delete income.");
      }
      setIncome((prev) => prev.filter((i) => i.id !== id));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not delete income.");
    }
  }, []);

  /**
   * Quick "Record Payment" action — adds `extraPaid` on top of whatever
   * has already been received, capped at the sale's total, without
   * requiring the farmer to reopen the full edit form. Used by the
   * "Add Payment" button on Partial/Due rows.
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

  // ── Filtering ─────────────────────────────

  const filteredIncome = useMemo<Income[]>(() => {
    return income.filter((i) => {
      if (filters.crop !== "All" && i.crop !== filters.crop) return false;
      if (filters.month && !i.date.startsWith(filters.month)) return false;
      if (filters.status !== "All" && getPaymentStatus(i) !== filters.status) return false;
      if (
        filters.search &&
        !i.buyer.toLowerCase().includes(filters.search.toLowerCase()) &&
        !i.note.toLowerCase().includes(filters.search.toLowerCase()) &&
        !i.crop.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [income, filters]);

  // ── Derived totals (always from full list) ─
  const totalIncome = useMemo(() => grandIncomeTotal(income), [income]);
  const totalDue    = useMemo(() => totalAmountDue(income), [income]);
  const statusSummary = useMemo(() => buildPaymentStatusSummary(income), [income]);

  function setFilter<K extends keyof IncomeFilters>(key: K, value: IncomeFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    income,
    filteredIncome,
    totalIncome,
    totalDue,
    statusSummary,
    isLoaded,
    error,

    addIncome,
    updateIncome,
    deleteIncome,
    recordPayment,

    filters,
    setFilter,
    resetFilters,
  };
}
