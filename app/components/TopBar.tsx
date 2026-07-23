"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – TopBar
//
//  The slim header that sits above the main
//  content area (to the RIGHT of the sidebar).
//  Contains: search, dark-mode toggle, bell, user.
//
//  Only shown when logged in and not on auth pages.
//
//  Routes that don't fit the mobile bottom nav
//  (Udhaar/Budgets/Recurring) used to live behind
//  a gear-icon overflow menu here. They've since
//  moved into the Profile page's Quick Links
//  section — Profile is already one tap away via
//  the avatar chip below, so there's no longer a
//  separate gear icon.
// ─────────────────────────────────────────────

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Moon, Sun, Bell, ChevronDown, X, AlertTriangle, Clock3, CheckCircle2, WifiOff, CloudUpload } from "lucide-react";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useOfflineQueueSummary } from "@/app/hooks/useOfflineQueueSummary";

const AUTH_PAGES = ["/login", "/signup"];

export default function TopBar() {
  const pathname       = usePathname();
  const { isDark, toggle } = useDarkMode();
  const { user }       = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, dismiss } = useNotifications();
  const { isOnline, pendingCount } = useOfflineQueueSummary();

  if (AUTH_PAGES.includes(pathname) || !user) return null;

  // Build initials: "Ram Bahadur" → "RB"
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex-shrink-0 sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-line">
      <header className="flex items-center gap-3 px-4 sm:px-6 h-14">
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
          {/* Offline / pending-sync indicator — only shows up when it's relevant */}
          {(!isOnline || pendingCount > 0) && (
            <span
              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl mr-1 ${
                !isOnline ? "bg-negative/10 text-negative" : "bg-accent/10 text-accent"
              }`}
            >
              {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <CloudUpload className="w-3.5 h-3.5" />}
              {!isOnline
                ? pendingCount > 0
                  ? `Offline · ${pendingCount} pending`
                  : "Offline"
                : `Syncing ${pendingCount}…`}
            </span>
          )}

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

          {/* User chip — tap to open Profile, which now also hosts Udhaar,
              Budgets, and Recurring quick links + logout on mobile. */}
          <Link
            href="/profile"
            className={`flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-surface-2 transition-colors select-none ml-1 ${
              pathname === "/profile" ? "bg-surface-2" : ""
            }`}
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
      </header>

      {/* Mobile equivalent of the offline/pending pill — full width strip
          instead of squeezing into the header row, which is already tight
          on small screens. */}
      {(!isOnline || pendingCount > 0) && (
        <div
          className={`sm:hidden flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 ${
            !isOnline ? "bg-negative/10 text-negative" : "bg-accent/10 text-accent"
          }`}
        >
          {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <CloudUpload className="w-3.5 h-3.5" />}
          {!isOnline
            ? pendingCount > 0
              ? `Offline · ${pendingCount} change${pendingCount === 1 ? "" : "s"} pending`
              : "Offline — changes will save on this device"
            : `Syncing ${pendingCount} change${pendingCount === 1 ? "" : "s"}…`}
        </div>
      )}

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
    </div>
  );
}