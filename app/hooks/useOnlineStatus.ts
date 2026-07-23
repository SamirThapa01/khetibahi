// ─────────────────────────────────────────────
//  KhetiBahi – useOnlineStatus
//  Tracks connectivity so data hooks know when to
//  queue a mutation instead of sending it straight
//  to the server, and when to flush that queue.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";

export function useOnlineStatus(): boolean {
  // Assume online until proven otherwise — avoids a flash of "offline" UI
  // on first render, and navigator isn't available during SSR anyway.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Deferred via queueMicrotask rather than called synchronously — this
    // is the same "external system → React state" read as localStorage
    // or matchMedia elsewhere in the app; deferring it avoids a
    // synchronous setState-in-effect on mount while still resolving
    // before the next paint.
    queueMicrotask(() => setIsOnline(navigator.onLine));
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
