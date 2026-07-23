"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – ServiceWorkerRegister
//
//  Renders nothing — just registers public/sw.js (built by Serwist
//  from app/sw.ts) once the app loads. Mounted once in the root
//  layout. No-ops harmlessly in dev, where the service worker build
//  is disabled (see next.config.ts).
// ─────────────────────────────────────────────

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
