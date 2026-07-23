// ─────────────────────────────────────────────
//  KhetiBahi – Offline mutation queue
//
//  When a farmer adds/edits/deletes something with no signal,
//  the request can't reach MongoDB. Instead of failing outright,
//  each data hook (useIncome, useExpenses, useLoans, useBudgets,
//  useCrops) applies the change to its own in-memory state right
//  away and drops the underlying HTTP request in here. Once the
//  device reconnects, useOfflineQueue() replays every queued
//  request, in the order it was made, against the real API.
//
//  Deliberately generic: this module knows nothing about Income,
//  Expense, or Loan shapes — it just remembers "do this HTTP
//  request later" entries. Each resource hook is responsible for
//  its own optimistic local state and for reconciling it once a
//  queued request actually succeeds (see useIncome.ts for the
//  reference implementation).
// ─────────────────────────────────────────────

export type QueuedMethod = "POST" | "PUT" | "DELETE";

export interface QueuedMutation {
  id: string;               // this queue entry's own id (not the record's id)
  resource: string;         // "income" | "expenses" | "loans" | "budgets" | "crops"
  method: QueuedMethod;
  url: string;
  body?: unknown;
  label: string;            // shown in the pending-sync UI, e.g. "Add income: Tomato — Ram"
  tempId?: string;          // for POST: the temporary client-side id given to the optimistic record
  targetId?: string;        // for PUT/DELETE: the real record id being changed
  createdAt: number;
}

const STORAGE_KEY = "khetibahi:offline-queue";
const CHANGE_EVENT = "khetibahi:offline-queue-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readQueue(): QueuedMutation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch (err) {
    console.error("Could not read offline queue:", err);
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Could not write offline queue:", err);
  }
  // Same-tab listeners don't get the browser's native "storage" event
  // (that only fires in OTHER tabs), so broadcast our own for useOfflineQueue
  // instances in this tab to pick up.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getQueueForResource(resource: string): QueuedMutation[] {
  return readQueue()
    .filter((m) => m.resource === resource)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getTotalPendingCount(): number {
  return readQueue().length;
}

export function enqueueMutation(input: Omit<QueuedMutation, "id" | "createdAt">): QueuedMutation {
  const mutation: QueuedMutation = {
    ...input,
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  writeQueue([...readQueue(), mutation]);
  return mutation;
}

export function dequeueMutation(id: string): void {
  writeQueue(readQueue().filter((m) => m.id !== id));
}

/**
 * A record that was created offline and hasn't synced yet has no real
 * server id — editing or deleting it before it syncs shouldn't queue a
 * separate PUT/DELETE against an id the server has never seen. Instead,
 * mutate (or drop) the still-queued POST directly.
 */
export function updateQueuedCreateBody(tempId: string, body: unknown): void {
  writeQueue(readQueue().map((m) => (m.tempId === tempId ? { ...m, body } : m)));
}

export function removeQueuedCreate(tempId: string): void {
  writeQueue(readQueue().filter((m) => m.tempId !== tempId));
}

/** Fires whenever the queue changes, in this tab or another. Returns an unsubscribe function. */
export function subscribeToQueueChanges(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
