// ─────────────────────────────────────────────
//  KhetiBahi – Web App Manifest
//
//  Next.js's built-in manifest route (app/manifest.ts) generates
//  /manifest.webmanifest automatically — no hand-written JSON file
//  to keep in sync. This is what makes Chrome/Android offer
//  "Install app" and gives the installed app its icon, name, and
//  standalone (no browser chrome) window.
// ─────────────────────────────────────────────

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KhetiBahi — Farm Ledger",
    short_name: "KhetiBahi",
    description:
      "Track income, expenses, udhaar, and buyer history for your farm — works offline in the field.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f4",
    theme_color: "#1f6b45",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
