"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – Language Context
//
//  Holds ONE piece of state — the active language — and makes
//  it available to every component in the tree via useLanguage().
//  This is the same pattern as useDarkMode()/AuthContext already
//  in this codebase: Context + localStorage, no routing changes.
//
//  Why localStorage and not the URL: next-intl-style setups put
//  the locale in the URL (/ne/expenses), which needs the whole
//  app/ tree restructured into app/[locale]/... . This app has
//  48+ existing route files already built, so we avoid that
//  entirely — the toggle just flips a client-side value.
// ─────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "ne";

const STORAGE_KEY = "khetibahi-lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default "en" on the server (and on first client render, to avoid
  // a hydration mismatch) — we read the real saved value in useEffect,
  // same pattern useDarkMode() presumably already uses in this app.
  const [lang, setLangState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ne") {
      setLangState(saved);
    }
    setHydrated(true);
  }, []);

  function setLang(next: Language) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleLang() {
    setLang(lang === "en" ? "ne" : "en");
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {/* suppressHydrationWarning-style guard: render children always,
          they just briefly show English until localStorage is read.
          hydrated is exposed via context if a component ever needs to
          avoid a flash — not needed for text swaps since English is a
          reasonable default flash. */}
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within <LanguageProvider>");
  }
  return ctx;
}
