// ─────────────────────────────────────────────
//  KhetiBahi – useNotifications Hook
//
//  Powers the bell icon in TopBar: loads active
//  notifications (loan due dates, budget overruns) on
//  mount, refreshes periodically, and lets the farmer
//  dismiss one without waiting on a full page reload.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";

export interface AppNotification {
  id: string;
  severity: "negative" | "accent";
  title: string;
  message: string;
  href: string;
}

// Refresh in the background every 5 minutes — frequent enough to feel
// live, infrequent enough not to hammer the API from a tab left open.
const REFRESH_MS = 5 * 60 * 1000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: AppNotification[] = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Could not load notifications:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data: AppNotification[] = await res.json();
        if (!cancelled) setNotifications(data);
      } catch (err) {
        console.error("Could not load notifications:", err);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();

    const interval = setInterval(fetchNotifications, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const dismiss = useCallback(async (id: string) => {
    // Optimistic — remove immediately, no need to block on the network
    // for something this low-stakes.
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Could not dismiss notification:", err);
    }
  }, []);

  return { notifications, isLoaded, dismiss, refetch: fetchNotifications };
}
