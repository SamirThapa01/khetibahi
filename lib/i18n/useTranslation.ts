"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – useTranslation hook
//
//  const t = useTranslation();
//  t("nav.expenses")                          → "Expenses" / "खर्च"
//  t("topbar.syncing", { count: 3 })          → "Syncing 3…" / "3 सिंक हुँदैछ…"
//
//  {count} etc. inside a dictionary string get replaced with the
//  matching value from the second argument. Any key not found in
//  the active language falls back to English, then to the raw key
//  itself (so a typo shows up as visible broken text instead of
//  crashing the page — easy to spot in QA).
// ─────────────────────────────────────────────

import { useLanguage } from "./LanguageContext";
import en, { type TranslationKey } from "./en";
import ne from "./ne";

type Vars = Record<string, string | number>;

export function useTranslation() {
  const { lang } = useLanguage();
  const dict = lang === "ne" ? ne : en;

  function t(key: TranslationKey, vars?: Vars): string {
    let str: string = dict[key] ?? en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }

  return t;
}
