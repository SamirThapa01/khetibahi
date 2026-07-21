"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – TopBar
//
//  The slim header that sits above the main
//  content area (to the RIGHT of the sidebar).
//  Contains: search, dark-mode toggle, bell, user.
//
//  Only shown when logged in and not on auth pages.
// ─────────────────────────────────────────────

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Moon, Sun, Bell, ChevronDown, Settings, PiggyBank, Repeat, HandCoins, X } from "lucide-react";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import { useAuth } from "@/app/context/AuthContext";

const AUTH_PAGES = ["/login", "/signup"];

// Destinations that don't fit on the mobile bottom nav (Navbar.tsx) —
// reachable from here instead via the gear icon (mobile only; on
// desktop the Sidebar already lists every route).
const MORE_NAV = [
  { href: "/loans",     label: "Udhaar",    Icon: HandCoins },
  { href: "/budgets",   label: "Budgets",   Icon: PiggyBank },
  { href: "/recurring", label: "Recurring", Icon: Repeat    },
];

export default function TopBar() {
  const pathname       = usePathname();
  const { isDark, toggle } = useDarkMode();
  const { user }       = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (AUTH_PAGES.includes(pathname) || !user) return null;

  const moreIsActive = MORE_NAV.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  // Build initials: "Ram Bahadur" → "RB"
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
        <input
          type="text"
          placeholder="Search crops, income, expenses…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-line bg-surface-2 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Gear — mobile only. Opens the overflow sheet for routes that
            don't fit on the bottom tab bar (desktop Sidebar already
            lists these, so the button is hidden there). */}
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="More menu"
          className={`sm:hidden p-2 rounded-xl transition-colors ${
            moreIsActive ? "text-brand bg-brand-soft" : "text-ink-muted hover:text-ink hover:bg-surface-2"
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Bell (decorative for now) */}
        <button
          aria-label="Notifications"
          className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User chip */}
        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-surface-2 transition-colors select-none ml-1"
        >
          {/* Avatar circle */}
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand text-white text-xs font-bold flex-shrink-0">
              {initials}
            </span>
          )}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-ink truncate max-w-[120px]">{user.name}</p>
            <p className="text-[11px] text-ink-muted">Farm Owner</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-ink-faint hidden sm:block" />
        </Link>
      </div>

      {/* Overflow sheet — gear icon opens this (mobile only) */}
      {moreOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-surface border-t border-line rounded-t-2xl shadow-lift p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">More</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Close" className="p-1 text-ink-faint">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MORE_NAV.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-medium transition-colors ${
                      active ? "text-brand bg-brand/10" : "text-ink-faint"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
