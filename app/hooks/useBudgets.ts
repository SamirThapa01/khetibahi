"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/app/types";

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
    fetchBudgets();
  }, [fetchBudgets]);

  const setBudget = useCallback(
    async (category: string, crop: string, month: string, amount: number) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, crop, month, amount }),
      });
      if (!res.ok) throw new Error("Failed to save budget");
      await fetchBudgets();
    },
    [fetchBudgets]
  );

  const deleteBudget = useCallback(async (id: string) => {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete budget");
    setBudgets((prev) => prev.filter((b) => b._id !== id));
  }, []);

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

  return { budgets: withProgress, loading, error, setBudget, deleteBudget, refetch: fetchBudgets };
}