// ─────────────────────────────────────────────
//  KhetiBahi – English dictionary
//
//  This file is the SOURCE OF TRUTH for translation keys.
//  Every key that exists here must also exist in ne.ts —
//  useTranslation.ts falls back to this file if a key is
//  ever missing from ne.ts, so the app never shows a raw
//  key like "nav.expenses" to the user.
//
//  Naming convention: "<area>.<thing>"
//  e.g. "nav.expenses", "topbar.searchPlaceholder"
// ─────────────────────────────────────────────

const en = {
  // ── Common / shared across components ──
  "common.farmOwner": "Farm Owner",
  "common.logout": "Log out",
  "common.notifications": "Notifications",
  "common.dismiss": "Dismiss",
  "common.close": "Close",
  "common.allCaughtUp": "You're all caught up.",

  // ── Sidebar / Navbar nav labels ──
  "nav.dashboard": "Dashboard",
  "nav.home": "Home",
  "nav.income": "Income",
  "nav.expenses": "Expenses",
  "nav.loans": "Udhaar",
  "nav.budgets": "Budgets",
  "nav.recurring": "Recurring",
  "nav.crops": "Crops",
  "nav.analytics": "Analytics",
  "nav.stats": "Stats",

  // ── TopBar ──
  "topbar.searchPlaceholder": "Search crops, income, expenses…",
  "topbar.toggleDarkMode": "Toggle dark mode",
  "topbar.offline": "Offline",
  "topbar.offlinePending": "Offline · {count} pending",
  "topbar.syncing": "Syncing {count}…",
  "topbar.offlineMobileNoPending": "Offline — changes will save on this device",
  "topbar.offlineMobilePendingOne": "Offline · {count} change pending",
  "topbar.offlineMobilePendingOther": "Offline · {count} changes pending",
  "topbar.syncingMobileOne": "Syncing {count} change…",
  "topbar.syncingMobileOther": "Syncing {count} changes…",
} as const;

export default en;

// Type used by ne.ts to guarantee it has every key `en` has, and
// used by useTranslation.ts so t("...") only accepts real keys —
// a typo like t("nav.expenses ") with a stray space fails to compile
// instead of silently rendering the raw key at runtime.
export type TranslationKey = keyof typeof en;
