// ─────────────────────────────────────────────
//  KhetiBahi – useOfflineQueue
//
//  One instance per resource ("income", "expenses", "loans",
//  "budgets", "crops"). Used INSIDE the resource's own data hook
//  (useIncome, useExpenses, ...) — not called directly by pages.
//
//  Give it an `onApplied` callback and it will, whenever the
//  device is online, replay that resource's queued mutations in
//  order and call `onApplied` for each one so the calling hook can
//  reconcile its own local state (e.g. swap a temporary offline-
//  created record for the real one MongoDB returned).
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  QueuedMutation,
  enqueueMutation,
  dequeueMutation,
  getQueueForResource,
  subscribeToQueueChanges,
} from "@/lib/offlineQueue";

type OnApplied = (
  mutation: QueuedMutation,
  response: Response | null,
  err: unknown
) => void | Promise<void>;

export function useOfflineQueue(resource: string, onApplied: OnApplied) {
  const isOnline = useOnlineStatus();
  const [pending, setPending] = useState<QueuedMutation[]>(() => getQueueForResource(resource));
  const isSyncingRef = useRef(false);

  // Kept in a ref so processPending always calls the latest reconciliation
  // logic without needing `onApplied` in its own dependency array (the
  // calling hook would otherwise recreate it on every render). Synced via
  // an effect rather than during render itself, since mutating a ref's
  // .current mid-render isn't safe.
  const onAppliedRef = useRef(onApplied);
  useEffect(() => {
    onAppliedRef.current = onApplied;
  });

  useEffect(() => {
    return subscribeToQueueChanges(() => setPending(getQueueForResource(resource)));
  }, [resource]);

  const enqueue = useCallback(
    (input: Omit<QueuedMutation, "id" | "createdAt" | "resource">) =>
      enqueueMutation({ ...input, resource }),
    [resource]
  );

  const processPending = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      for (const mutation of getQueueForResource(resource)) {
        try {
          const res = await fetch(mutation.url, {
            method: mutation.method,
            headers: mutation.body ? { "Content-Type": "application/json" } : undefined,
            body: mutation.body ? JSON.stringify(mutation.body) : undefined,
          });
          await onAppliedRef.current(mutation, res, null);
          dequeueMutation(mutation.id);
        } catch (err) {
          // Still offline (or the connection just flapped) — stop here so
          // later mutations aren't applied out of order. Everything from
          // this point stays queued and retries on the next reconnect.
          await onAppliedRef.current(mutation, null, err);
          break;
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [resource]);

  // Flush on mount (covers "left some things queued, reopened the app
  // already online") and every time we transition to online.
  useEffect(() => {
    if (isOnline) processPending();
  }, [isOnline, processPending]);

  return { isOnline, pending, pendingCount: pending.length, enqueue, processPending };
}
