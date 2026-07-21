"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – Mobile Bottom Nav
//
//  Only visible on small screens (sm:hidden).
//  The desktop sidebar (Sidebar.tsx) + TopBar
//  handle navigation on larger screens.
//
//  Only the 5 most-used destinations live here —
//  8 tabs in one row was too tight on small screens.
//  Udhaar, Budgets, and Recurring now live behind
//  the gear icon in TopBar.tsx instead.
// ─────────────────────────────────────────────

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListFilter, BarChart2, Coins, Leaf } from "lucide-react";

const NAV = [
  { href: "/",          label: "Home",      Icon: LayoutDashboard },
  { href: "/income",    label: "Income",    Icon: Coins           },
  { href: "/expenses",  label: "Expenses",  Icon: ListFilter      },
  { href: "/crops",     label: "Crops",     Icon: Leaf            },
  { href: "/analytics", label: "Stats",     Icon: BarChart2       },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 flex bg-surface/95 backdrop-blur-md border-t border-line shadow-lift">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              active ? "text-brand" : "text-ink-faint"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
