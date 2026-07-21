"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – Sidebar (desktop only)
//
//  Always-dark sidebar nav — same visual pattern
//  as VS Code, Figma, HarvestHub. It doesn't flip
//  with dark mode; the CSS vars are fixed.
//
//  On mobile this is hidden entirely — the bottom
//  tab bar (Navbar.tsx) takes its place.
// ─────────────────────────────────────────────

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sprout,
  LayoutDashboard,
  ListFilter,
  BarChart2,
  Coins,
  LogOut,
  Wheat,
  Leaf,
  PiggyBank,
  Repeat,
  HandCoins
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const NAV = [
  { href: "/",          label: "Dashboard", Icon: LayoutDashboard },
  { href: "/income",    label: "Income",    Icon: Coins           },
  { href: "/expenses",  label: "Expenses",  Icon: ListFilter      },
  { href: "/loans",     label: "Udhaar",    Icon: HandCoins       },
  { href: "/budgets",   label: "Budgets",   Icon: PiggyBank       },
 { href: "/recurring", label: "Recurring", Icon: Repeat          },
  { href: "/crops",     label: "Crops",     Icon: Leaf            },
  { href: "/analytics", label: "Analytics", Icon: BarChart2       },
];

const AUTH_PAGES = ["/login", "/signup"];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();

  // Hide on auth pages and while not logged in
  if (AUTH_PAGES.includes(pathname) || !user) return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside
      className="hidden sm:flex flex-col flex-shrink-0 h-screen overflow-y-auto"
      style={{
        width: "var(--sidebar-w)",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
          style={{ background: "#2d6a4f" }}
        >
          <Sprout className="w-4 h-4 text-white" />
        </span>
        <span
          className="font-display font-bold text-base tracking-tight"
          style={{ color: "var(--sidebar-text-act)" }}
        >
          KhetiBahi
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background:  active ? "var(--sidebar-active)" : "transparent",
                color:       active ? "var(--sidebar-text-act)" : "var(--sidebar-text)",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Farm / user footer ── */}
      <div
        className="px-4 py-4 mt-auto space-y-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {/* Farm identity row */}
        <Link href="/profile" className="flex items-center gap-2.5 group">
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <span
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Wheat className="w-4 h-4" style={{ color: "var(--sidebar-text)" }} />
            </span>
          )}
          <div className="min-w-0">
            <p
              className="text-xs font-semibold leading-tight truncate group-hover:underline"
              style={{ color: "var(--sidebar-text-act)" }}
            >
              {user.name}
            </p>
            <p className="text-[11px] leading-tight truncate" style={{ color: "var(--sidebar-text)" }}>
              Farm Owner
            </p>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
