// ─────────────────────────────────────────────
//  KhetiBahi – Nepali (Devanagari) dictionary
//
//  Must have the same keys as en.ts. TypeScript enforces
//  this via `satisfies Record<TranslationKey, string>` below —
//  if you add a key to en.ts and forget it here, this file
//  will fail to compile instead of silently falling back.
// ─────────────────────────────────────────────

import type { TranslationKey } from "./en";

const ne = {
  // ── Common ──
  "common.farmOwner": "किसान",
  "common.logout": "लगआउट",
  "common.notifications": "सूचनाहरू",
  "common.dismiss": "हटाउनुहोस्",
  "common.close": "बन्द गर्नुहोस्",
  "common.allCaughtUp": "तपाईं सबै अपडेट हुनुहुन्छ।",

  // ── Sidebar / Navbar ──
  "nav.dashboard": "ड्यासबोर्ड",
  "nav.home": "गृहपृष्ठ",
  "nav.income": "आम्दानी",
  "nav.expenses": "खर्च",
  "nav.loans": "उधारो",
  "nav.budgets": "बजेट",
  "nav.recurring": "आवर्ती खर्च",
  "nav.crops": "बाली",
  "nav.analytics": "विश्लेषण",
  "nav.stats": "तथ्याङ्क",

  // ── TopBar ──
  "topbar.searchPlaceholder": "बाली, आम्दानी, खर्च खोज्नुहोस्…",
  "topbar.toggleDarkMode": "डार्क मोड बदल्नुहोस्",
  "topbar.offline": "अफलाइन",
  "topbar.offlinePending": "अफलाइन · {count} बाँकी",
  "topbar.syncing": "{count} सिंक हुँदैछ…",
  "topbar.offlineMobileNoPending": "अफलाइन — परिवर्तनहरू यही डिभाइसमा सुरक्षित हुनेछन्",
  "topbar.offlineMobilePendingOne": "अफलाइन · {count} परिवर्तन बाँकी",
  "topbar.offlineMobilePendingOther": "अफलाइन · {count} परिवर्तनहरू बाँकी",
  "topbar.syncingMobileOne": "{count} परिवर्तन सिंक हुँदैछ…",
  "topbar.syncingMobileOther": "{count} परिवर्तनहरू सिंक हुँदैछ…",
} satisfies Record<TranslationKey, string>;

export default ne;
