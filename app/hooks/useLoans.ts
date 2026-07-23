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
import { grandLoanTotal, totalLoanDue, getLoanStatus, buildLoanStatusSummary, formatNPR } from "@/app/utils/helpers";
import { useInformation } from "../components/Information";
import { useOfflineQueue } from "./useOfflineQueue";
import { QueuedMutation, updateQueuedCreateBody, removeQueuedCreate } from "@/lib/offlineQueue";

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

  // ── Offline queue ───────────────────────────
  const handleApplied = useCallback(
    async (mutation: QueuedMutation, res: Response | null, err: unknown) => {
      if (err || !res) return; // network still down; stays queued, retried next reconnect
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        show("error", `Could not sync "${mutation.label}": ${body.error ?? "server rejected it"}`);
        if (mutation.method === "POST" && mutation.tempId) {
          setLoans((prev) => prev.filter((l) => l.id !== mutation.tempId));
        }
        return;
      }
      if (mutation.method === "POST" && mutation.tempId) {
        const saved: Loan = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === mutation.tempId ? saved : l)));
      } else if (mutation.method === "PUT" && mutation.targetId) {
        const updated: Loan = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === mutation.targetId ? updated : l)));
      } else if (mutation.method === "POST" && mutation.targetId) {
        // Interest payment — the endpoint returns the whole updated loan.
        const updated: Loan = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === mutation.targetId ? updated : l)));
      }
      show("success", `Synced: ${mutation.label}`);
    },
    [show]
  );

  const { isOnline, pendingCount, enqueue } = useOfflineQueue("loans", handleApplied);

  // ── CRUD actions ───────────────────────────

  const addLoan = useCallback(
    async (data: LoanFormData): Promise<void> => {
      if (!isOnline) {
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const optimistic: Loan = {
          ...data,
          id: tempId,
          interestPayments: [],
          createdAt: new Date().toISOString(),
        };
        setLoans((prev) => [optimistic, ...prev]);
        enqueue({
          method: "POST",
          url: "/api/loans",
          body: data,
          label: `Add udhaar: ${data.lenderName}`,
          tempId,
        });
        show("info", "No connection — saved on this device, will sync once you're back online");
        return;
      }
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
    [isOnline, enqueue, show]
  );

  const updateLoan = useCallback(
    async (id: string, data: LoanFormData): Promise<void> => {
      if (!isOnline) {
        if (id.startsWith("offline-")) {
          updateQueuedCreateBody(id, data);
          setLoans((prev) =>
            prev.map((l) => (l.id === id ? { ...data, id, interestPayments: l.interestPayments, createdAt: l.createdAt } : l))
          );
          return;
        }
        setLoans((prev) =>
          prev.map((l) => (l.id === id ? { ...data, id, interestPayments: l.interestPayments, createdAt: l.createdAt } : l))
        );
        enqueue({
          method: "PUT",
          url: `/api/loans/${id}`,
          body: data,
          label: `Update udhaar: ${data.lenderName}`,
          targetId: id,
        });
        show("info", "No connection — saved on this device, will sync once you're back online");
        return;
      }
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
    [isOnline, enqueue, show]
  );

  const deleteLoan = useCallback(
    async (id: string): Promise<void> => {
      if (!isOnline) {
        if (id.startsWith("offline-")) {
          removeQueuedCreate(id);
          setLoans((prev) => prev.filter((l) => l.id !== id));
          show("info", "Removed (was never synced)");
          return;
        }
        setLoans((prev) => prev.filter((l) => l.id !== id));
        enqueue({
          method: "DELETE",
          url: `/api/loans/${id}`,
          label: "Delete udhaar record",
          targetId: id,
        });
        show("info", "No connection — will delete once you're back online");
        return;
      }
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
    [isOnline, enqueue, show]
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
      if (!isOnline) {
        // A loan that hasn't synced yet has no real server id to attach an
        // interest payment to, and the create endpoint doesn't accept
        // interestPayments at creation time — so this one case can't be
        // queued cleanly. Ask the farmer to redo it once the udhaar itself
        // has synced, rather than silently losing it or building a chain
        // of dependent offline mutations for a narrow edge case.
        if (id.startsWith("offline-")) {
          show("error", "This udhaar hasn't synced yet — record the interest payment again once you're back online.");
          return;
        }
        setLoans((prev) =>
          prev.map((l) => (l.id === id ? { ...l, interestPayments: [...l.interestPayments, { date, amount }] } : l))
        );
        enqueue({
          method: "POST",
          url: `/api/loans/${id}/interest`,
          body: { date, amount },
          label: `Interest payment: ${formatNPR(amount)}`,
          targetId: id,
        });
        show("info", "No connection — saved on this device, will sync once you're back online");
        return;
      }
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
    [isOnline, enqueue, show]
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
    isOnline,
    pendingCount,

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
