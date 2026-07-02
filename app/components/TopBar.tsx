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

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Moon, Sun, Bell, ChevronDown } from "lucide-react";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import { useAuth } from "@/app/context/AuthContext";

const AUTH_PAGES = ["/login", "/signup"];

export default function TopBar() {
  const pathname       = usePathname();
  const { isDark, toggle } = useDarkMode();
  const { user }       = useAuth();

  if (AUTH_PAGES.includes(pathname) || !user) return null;

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
    </header>
  );
}
