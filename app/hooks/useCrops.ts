// ─────────────────────────────────────────────
//  KhetiBahi – useCrops
//  THE BRAIN for the vegetable list. Merges the
//  built-in CROPS (constants.ts) with whatever this
//  farmer has added themselves, and exposes addCrop()
//  so any form can grow the list on the fly.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import { CROPS as BUILT_IN_CROPS } from "@/app/utils/constants";
import { useOfflineQueue } from "./useOfflineQueue";
import { QueuedMutation } from "@/lib/offlineQueue";
import { useInformation } from "@/app/components/Information";

export interface CropOption {
  value: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}

export function useCrops() {
  const [customCrops, setCustomCrops] = useState<CropOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useInformation();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/crops");
      if (!res.ok) return;
      const data: { id: string; name: string; emoji: string }[] = await res.json();
      setCustomCrops(
        data.map((c) => ({ value: c.name, label: c.name, emoji: c.emoji, isCustom: true }))
      );
    } catch {
      // silent — the built-in list still works even if this fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  // ── Offline queue ───────────────────────────
  // A custom crop only has one meaningful field, its name — once the
  // queued POST succeeds, refreshing the whole list from the server is
  // simpler and just as correct as trying to reconcile one entry, and
  // the existing de-dupe-by-name guard below means it can't double up.
  const handleApplied = useCallback(
    async (mutation: QueuedMutation, res: Response | null, err: unknown) => {
      if (err || !res) return; // network still down; stays queued, retried next reconnect
      if (!res.ok) {
        show("error", `Could not sync "${mutation.label}"`);
        return;
      }
      show("success", `Synced: ${mutation.label}`);
      await load();
    },
    [show, load]
  );

  const { isOnline, pendingCount, enqueue } = useOfflineQueue("crops", handleApplied);

  /** Adds a new vegetable for this farmer and returns it (or the existing match if it's a dupe). */
  async function addCrop(name: string, emoji: string): Promise<CropOption | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    if (!isOnline) {
      const option: CropOption = { value: trimmed, label: trimmed, emoji: emoji || "🌱", isCustom: true };
      setCustomCrops((prev) => (prev.some((c) => c.value === option.value) ? prev : [...prev, option]));
      enqueue({
        method: "POST",
        url: "/api/crops",
        body: { name: trimmed, emoji: emoji || "🌱" },
        label: `Add vegetable: ${trimmed}`,
      });
      show("info", "No connection — saved on this device, will sync once you're back online");
      return option;
    }

    const res = await fetch("/api/crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, emoji: emoji || "🌱" }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Could not add vegetable.");
    }

    const created = await res.json();
    const option: CropOption = { value: created.name, label: created.name, emoji: created.emoji, isCustom: true };

    setCustomCrops((prev) =>
      prev.some((c) => c.value === option.value) ? prev : [...prev, option]
    );
    return option;
  }

  // Built-in list first (with "All Crops" pinned at the top), then this farmer's own additions
  const crops: CropOption[] = [...BUILT_IN_CROPS, ...customCrops];

  return { crops, customCrops, loading, isOnline, pendingCount, addCrop, refresh: load };
}
