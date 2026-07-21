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
import { Search, Moon, Sun, Bell, ChevronDown, Settings, PiggyBank, Repeat, HandCoins, X, AlertTriangle, Clock3, CheckCircle2 } from "lucide-react";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/hooks/useNotifications";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, dismiss } = useNotifications();

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

        {/* Bell — shows a count badge and opens the notifications panel */}
        <button
          onClick={() => setNotifOpen((v) => !v)}
          aria-label="Notifications"
          className={`relative p-2 rounded-xl transition-colors ${
            notifOpen ? "text-brand bg-brand-soft" : "text-ink-muted hover:text-ink hover:bg-surface-2"
          }`}
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-negative text-white text-[10px] font-bold leading-none">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
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

      {/* Notifications panel — bell icon opens this */}
      {notifOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setNotifOpen(false)}>
          <div
            className="absolute right-3 sm:right-6 top-14 mt-2 w-[calc(100vw-1.5rem)] max-w-sm max-h-[70vh] overflow-y-auto bg-surface border border-line rounded-2xl shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="text-sm font-display font-semibold text-ink">Notifications</span>
              <button onClick={() => setNotifOpen(false)} aria-label="Close" className="p-1 text-ink-faint">
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-brand" />
                <p className="text-xs text-ink-muted">You&apos;re all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map((n) => {
                  const Icon = n.severity === "negative" ? AlertTriangle : Clock3;
                  const color = n.severity === "negative" ? "text-negative" : "text-accent";
                  return (
                    <div key={n.id} className="flex items-start gap-2.5 px-4 py-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
                      <Link
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex-1 min-w-0"
                      >
                        <p className="text-xs font-semibold text-ink">{n.title}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">{n.message}</p>
                      </Link>
                      <button
                        onClick={() => dismiss(n.id)}
                        aria-label="Dismiss"
                        className="flex-shrink-0 p-1 rounded-lg text-ink-faint hover:bg-surface-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overflow drawer — gear icon opens this (mobile only). Always
          mounted so the transform transition can animate both the
          slide-in AND slide-out, instead of just popping in. */}
      <div
        className={`sm:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          moreOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMoreOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-surface border-l border-line shadow-lift p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] transition-transform duration-300 ease-out ${
            moreOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">More</span>
            <button onClick={() => setMoreOpen(false)} aria-label="Close" className="p-1 text-ink-faint">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {MORE_NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "text-brand bg-brand/10" : "text-ink-muted hover:bg-surface-2"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
