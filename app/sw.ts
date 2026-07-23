// ─────────────────────────────────────────────
//  KhetiBahi – Service worker (compiled by Serwist → public/sw.js)
//
//  Two DIFFERENT kinds of "offline" work together in this app:
//    1. DATA offline (lib/offlineQueue.ts) — queues add/edit/delete
//       requests in localStorage and replays them on reconnect.
//    2. APP SHELL offline (this file) — caches the actual JS/CSS/HTML
//       so the app can even OPEN with zero connection, not just keep
//       working once it's already loaded. Without this, a farmer with
//       no signal who force-closes the app couldn't reopen it at all.
//
//  runtimeCaching uses Serwist's sane Next.js defaults (cache-first for
//  static assets/fonts, network-first for pages/API so data is fresh
//  whenever there IS a connection, falling back to cache when there
//  isn't).
// ─────────────────────────────────────────────

/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
