// ─────────────────────────────────────────────
//  KhetiBahi – useOfflineQueueSummary
//
//  Unlike useOfflineQueue (one per resource, lives inside
//  useIncome/useExpenses/etc.), this gives a whole-app view:
//  "are we online, and how many changes are waiting to sync
//  in total, across every resource?" Used by the TopBar banner,
//  which is mounted on every page regardless of which data
//  hooks that page happens to use.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { getTotalPendingCount, subscribeToQueueChanges } from "@/lib/offlineQueue";

export function useOfflineQueueSummary() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setPendingCount(getTotalPendingCount()));
    return subscribeToQueueChanges(() => setPendingCount(getTotalPendingCount()));
  }, []);

  return { isOnline, pendingCount };
}
