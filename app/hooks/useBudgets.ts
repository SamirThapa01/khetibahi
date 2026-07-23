"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/app/types";
import { useOfflineQueue } from "./useOfflineQueue";
import { QueuedMutation, removeQueuedCreate } from "@/lib/offlineQueue";
import { useInformation } from "@/app/components/Information";

export interface Budget {
  _id: string;
  category: string;
  crop: string;
  month: string;
  amount: number;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export function useBudgets(expenses: Expense[]) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { show } = useInformation();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budgets");
      if (!res.ok) throw new Error("Failed to load budgets");
      setBudgets(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(fetchBudgets);
  }, [fetchBudgets]);

  // ── Offline queue ───────────────────────────
  // Budgets are upsert-by-(category, crop, month) rather than having
  // separate add/edit paths, so once a queued POST actually reaches the
  // server the simplest correct thing is a full refetch — there's no
  // single "this record became that record" swap to make like there is
  // for Income/Expenses/Loans.
  const handleApplied = useCallback(
    async (mutation: QueuedMutation, res: Response | null, err: unknown) => {
      if (err || !res) return; // network still down; stays queued, retried next reconnect
      if (!res.ok) {
        show("error", `Could not sync "${mutation.label}"`);
        await fetchBudgets(); // drop whatever optimistic guess we made, trust the server
        return;
      }
      show("success", `Synced: ${mutation.label}`);
      await fetchBudgets();
    },
    [show, fetchBudgets]
  );

  const { isOnline, pendingCount, enqueue } = useOfflineQueue("budgets", handleApplied);

  const setBudget = useCallback(
    async (category: string, crop: string, month: string, amount: number) => {
      if (!isOnline) {
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setBudgets((prev) => {
          const existing = prev.find((b) => b.category === category && b.crop === crop && b.month === month);
          if (existing) {
            return prev.map((b) => (b === existing ? { ...b, amount } : b));
          }
          return [...prev, { _id: tempId, category, crop, month, amount }];
        });
        enqueue({
          method: "POST",
          url: "/api/budgets",
          body: { category, crop, month, amount },
          label: `Set budget: ${category === "All" ? "Overall" : category}${crop !== "All" ? ` · ${crop}` : ""}`,
          tempId,
        });
        show("info", "No connection — saved on this device, will sync once you're back online");
        return;
      }
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, crop, month, amount }),
      });
      if (!res.ok) throw new Error("Failed to save budget");
      await fetchBudgets();
    },
    [isOnline, enqueue, show, fetchBudgets]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      if (!isOnline) {
        if (id.startsWith("offline-")) {
          removeQueuedCreate(id);
          setBudgets((prev) => prev.filter((b) => b._id !== id));
          show("info", "Removed (was never synced)");
          return;
        }
        setBudgets((prev) => prev.filter((b) => b._id !== id));
        enqueue({
          method: "DELETE",
          url: `/api/budgets/${id}`,
          label: "Delete budget",
          targetId: id,
        });
        show("info", "No connection — will delete once you're back online");
        return;
      }
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete budget");
      setBudgets((prev) => prev.filter((b) => b._id !== id));
    },
    [isOnline, enqueue, show]
  );

  const withProgress: BudgetProgress[] = budgets.map((b) => {
    const spent = expenses
      .filter((e) => {
        const expenseMonth = e.date.slice(0, 7);
        const categoryMatches = b.category === "All" || e.category === b.category;
        const cropMatches = b.crop === "All" || e.crop === b.crop;
        return expenseMonth === b.month && categoryMatches && cropMatches;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      ...b,
      spent,
      remaining: b.amount - spent,
      percentUsed: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
      isOverBudget: spent > b.amount,
    };
  });

  return { budgets: withProgress, loading, error, isOnline, pendingCount, setBudget, deleteBudget, refetch: fetchBudgets };
}