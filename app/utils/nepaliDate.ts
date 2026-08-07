// ─────────────────────────────────────────────
//  KhetiBahi – Nepali (Bikram Sambat) Date Helpers
//
//  Every date field in the app is stored as a plain Gregorian (AD)
//  "YYYY-MM-DD" string — that doesn't change. This file only adds a
//  read-side conversion so the farmer can also SEE the Bikram Sambat
//  (BS) date next to it, since that's how most people in Nepal
//  actually think about dates day-to-day.
//
//  Uses parseISO() (not `new Date(isoString)`) to build the JS Date
//  first — parseISO reads "YYYY-MM-DD" as LOCAL midnight, avoiding the
//  classic bug where UTC-parsing a date-only string shifts it a day
//  backwards in negative-UTC-offset timezones.
// ─────────────────────────────────────────────

import NepaliDate from "nepali-date-converter";
import { parseISO } from "date-fns";

/** "2026-08-06" → "2083 Shrawan 21" */
export function adToBS(isoDate: string): string {
  try {
    const nd = new NepaliDate(parseISO(isoDate));
    return nd.format("YYYY MMMM D", "en");
  } catch {
    return "";
  }
}

/** "2026-08-06" → "2083 Shrawan" (no day) — used for season labels */
export function adToBSMonthYear(isoDate: string): string {
  try {
    const nd = new NepaliDate(parseISO(isoDate));
    return nd.format("YYYY MMMM", "en");
  } catch {
    return "";
  }
}

/** Current Bikram Sambat year, e.g. 2083 — used to keep season labels correct without manual updates every AD new year. */
export function currentBSYear(): number {
  try {
    return new NepaliDate().getYear();
  } catch {
    // Fallback: BS is roughly AD + 56/57, close enough if the library ever fails to load
    return new Date().getFullYear() + 57;
  }
}

/** Today's BS date, e.g. "2083 Shrawan 21" — for headers like the Today's Entries widget */
export function todayBS(): string {
  try {
    return new NepaliDate().format("YYYY MMMM D", "en");
  } catch {
    return "";
  }
}
