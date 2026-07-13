"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecurringExpenseItem {
  _id: string;
  category: string;
  crop: string;
  amount: number;
  note?: string;
  frequency: "weekly" | "monthly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  lastGeneratedDate?: string;
  active: boolean;
}

export function useRecurringExpenses() {
  const [items, setItems] = useState<RecurringExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring");
      if (!res.ok) throw new Error("Failed to load recurring expenses");
      setItems(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addRecurring = useCallback(
    async (data: Omit<RecurringExpenseItem, "_id" | "active" | "lastGeneratedDate">) => {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create recurring expense");
      await fetchItems();
    },
    [fetchItems]
  );

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) throw new Error("Failed to update recurring expense");
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, active } : i)));
  }, []);

  const deleteRecurring = useCallback(async (id: string) => {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete recurring expense");
    setItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  return { items, loading, error, addRecurring, toggleActive, deleteRecurring, refetch: fetchItems };
}