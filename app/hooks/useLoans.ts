// ─────────────────────────────────────────────
//  KhetiBahi – useLoans Hook
//
//  Same pattern as useIncome: loads from the API
//  (→ MongoDB) on mount, sends every add/edit/delete
//  straight to the server, and exposes filtering +
//  computed totals for udhaar (credit) tracking.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loan, LoanFormData, LoanSource, PaymentStatus } from "@/app/types";
import { grandLoanTotal, totalLoanDue, getLoanStatus, buildLoanStatusSummary } from "@/app/utils/helpers";
import { useInformation } from "../components/Information";

export interface LoanFilters {
  source: LoanSource | "All";
  month: string; // "YYYY-MM" or "" for all
  search: string; // matches lender name or note
  status: PaymentStatus | "All";
}

const DEFAULT_FILTERS: LoanFilters = {
  source: "All",
  month: "",
  search: "",
  status: "All",
};

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filters, setFilters] = useState<LoanFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useInformation();

  // ── Load from the database once on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/loans");
        if (!res.ok) throw new Error("Could not load loans.");
        const data: Loan[] = await res.json();
        if (!cancelled) setLoans(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load loans. Please refresh.");
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── CRUD actions ───────────────────────────

  const addLoan = useCallback(
    async (data: LoanFormData): Promise<void> => {
      try {
        const res = await fetch("/api/loans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          show("error", body.error ?? "Could not save udhaar");
          throw new Error(body.error ?? "Could not save udhaar.");
        }
        const saved: Loan = await res.json();
        setLoans((prev) => [saved, ...prev]);
        setError(null);
        show("success", "Udhaar added");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not save udhaar.");
      }
    },
    [show]
  );

  const updateLoan = useCallback(
    async (id: string, data: LoanFormData): Promise<void> => {
      try {
        const res = await fetch(`/api/loans/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          show("error", body.error ?? "Could not update udhaar");
          throw new Error(body.error ?? "Could not update udhaar.");
        }
        const updated: Loan = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === id ? updated : l)));
        setError(null);
        show("success", "Udhaar updated");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not update udhaar.");
      }
    },
    [show]
  );

  const deleteLoan = useCallback(
    async (id: string): Promise<void> => {
      try {
        const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          show("error", body.error ?? "Could not delete udhaar");
          throw new Error(body.error ?? "Could not delete udhaar.");
        }
        setLoans((prev) => prev.filter((l) => l.id !== id));
        setError(null);
        show("success", "Udhaar deleted");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not delete udhaar.");
      }
    },
    [show]
  );

  /**
   * Quick "Record Repayment" action — adds `extraRepaid` on top of
   * whatever's already been paid back, capped at the loan's total,
   * without requiring a full edit. Mirrors useIncome's recordPayment.
   *
   * No show() call here on purpose — this delegates to updateLoan, which
   * already toasts on success/failure. Toasting here too would fire two
   * messages for one click.
   */
  const recordRepayment = useCallback(
    async (id: string, extraRepaid: number): Promise<void> => {
      const target = loans.find((l) => l.id === id);
      if (!target) return;
      const newAmountRepaid = Math.min(target.amount, target.amountRepaid + extraRepaid);
      await updateLoan(id, {
        lenderName: target.lenderName,
        source: target.source,
        crop: target.crop,
        amount: target.amount,
        amountRepaid: newAmountRepaid,
        dateTaken: target.dateTaken,
        dueDate: target.dueDate,
        interestRate: target.interestRate,
        note: target.note,
        billImage: target.billImage,
      });
    },
    [loans, updateLoan]
  );

  /**
   * Quick "Record Interest Payment" action — logs one interest payment
   * against a loan via its own endpoint (so we don't have to resend the
   * whole loan just to append one entry). No show() call here either,
   * for the same reason as recordRepayment — avoid double-toasting.
   */
  const recordInterestPayment = useCallback(
    async (id: string, date: string, amount: number): Promise<void> => {
      try {
        const res = await fetch(`/api/loans/${id}/interest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, amount }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          show("error", body.error ?? "Could not record interest payment");
          throw new Error(body.error ?? "Could not record interest payment.");
        }
        const updated: Loan = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === id ? updated : l)));
        setError(null);
        show("success", "Interest payment recorded");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not record interest payment.");
      }
    },
    [show]
  );

  // ── Filtering ─────────────────────────────

  const filteredLoans = useMemo<Loan[]>(() => {
    return loans.filter((l) => {
      if (filters.source !== "All" && l.source !== filters.source) return false;
      if (filters.month && !l.dateTaken.startsWith(filters.month)) return false;
      if (filters.status !== "All" && getLoanStatus(l) !== filters.status) return false;
      if (
        filters.search &&
        !l.lenderName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !l.note.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [loans, filters]);

  // ── Derived totals (always from full list) ─
  const totalLoans = useMemo(() => grandLoanTotal(loans), [loans]);
  const totalDue = useMemo(() => totalLoanDue(loans), [loans]);
  const statusSummary = useMemo(() => buildLoanStatusSummary(loans), [loans]);

  function setFilter<K extends keyof LoanFilters>(key: K, value: LoanFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    loans,
    filteredLoans,
    totalLoans,
    totalDue,
    statusSummary,
    isLoaded,
    error,

    addLoan,
    updateLoan,
    deleteLoan,
    recordRepayment,
    recordInterestPayment,

    filters,
    setFilter,
    resetFilters,
  };
}
