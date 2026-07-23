import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Generates public/sw.js at build time from app/sw.ts, and precaches
// every static asset Next.js produces (so the app SHELL loads even with
// zero connection — separate from the offline data queue, which handles
// the DATA side of working offline).
// Disabled in dev: a service worker caching your own dev server makes
// hot-reload behave unpredictably (stale JS surviving a refresh).
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
