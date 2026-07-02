"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – LayoutShell
//
//  This client component sits just inside
//  <AuthProvider> in layout.tsx and decides
//  which shell to render:
//
//  Auth pages (/login, /signup):
//    Plain full-screen content — no sidebar, no
//    topbar, no mobile nav.
//
//  App pages (everything else):
//    ┌─────────────┬────────────────────────────┐
//    │             │ TopBar                     │
//    │  Sidebar    ├────────────────────────────┤
//    │  (desktop)  │  main content (scrollable) │
//    │             │                            │
//    └─────────────┴────────────────────────────┘
//    Mobile bottom nav fixed at bottom (no sidebar)
//
//  Why a separate component and not inline in
//  layout.tsx? Because layout.tsx is a Server
//  Component — it can't use hooks like usePathname.
//  LayoutShell is a Client Component so it CAN.
// ─────────────────────────────────────────────

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Navbar from "./Navbar";

const AUTH_PAGES = ["/login", "/signup"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // ── Auth pages: bare full-screen, no chrome ──
  if (isAuthPage) {
    return <>{children}</>;
  }

  // ── App pages: sidebar + topbar + content ───
  return (
    // h-screen + overflow-hidden on the flex row makes BOTH the sidebar
    // and the main content area each control their own scroll independently.
    // The sidebar never scrolls off-screen; only the content area scrolls.
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile via Sidebar.tsx itself */}
      <Sidebar />

      {/* Main column: topbar sticks to top, content scrolls below it */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-24 sm:pb-8">
          <div className="max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — shown only on small screens, hidden on sm+ */}
      <Navbar />
    </div>
  );
}
