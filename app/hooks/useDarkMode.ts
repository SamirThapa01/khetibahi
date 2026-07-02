// ─────────────────────────────────────────────
//  KhetiBahi – useDarkMode Hook
//  Persists the user's preference in localStorage
//  and adds/removes the "dark" class on <html>.
// ─────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Read saved preference on first render
  useEffect(() => {
    const saved = localStorage.getItem("khetibahi_dark_mode");
    // If nothing saved, check system preference
    const prefersDark =
      saved !== null
        ? saved === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggle() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("khetibahi_dark_mode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return { isDark, toggle };
}
