// ─────────────────────────────────────────────
//  KhetiBahi – Auth Proxy
//
//  Next.js 16 renamed this file convention from
//  "middleware" to "proxy" (you'll see this if you
//  search around — older tutorials still say
//  middleware.ts). Same idea either way: Next.js
//  runs this on EVERY request that matches
//  `config.matcher` below, BEFORE the page or API
//  route even loads. Think of it as a bouncer at
//  the door: it only checks "do you have a valid
//  wristband (JWT)?" — it doesn't know or care what
//  happens inside.
//
//  Why bother, when our API routes already call
//  getCurrentUser() themselves? Defense in depth:
//  if we ever add a new protected route and forget
//  the check inside it, the proxy still catches it.
//  Belt AND suspenders — this file does the fast,
//  "optimistic" check (is there a valid-looking
//  token?), the route handlers still do the
//  authoritative one (look the user up in MongoDB).
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/signup"];

// Routes that authenticate themselves with something other than the user's
// JWT cookie (e.g. a cron job carrying CRON_SECRET, not a logged-in
// farmer's session) — the proxy must NOT demand a user cookie on these,
// or the cron caller gets a 401 before the route's own check ever runs.
const SELF_AUTHENTICATING_ROUTES = ["/api/recurring/generate"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SELF_AUTHENTICATING_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = await verifyAuthToken(token);

  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // ── Already logged in but visiting /login or /signup? ──
  // Send them to the dashboard instead — no reason to log in twice.
  if (isAuthPage) {
    if (user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // ── No valid session on a protected route ──
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Remember where they were headed so we can send them back after login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/expenses/:path*",
    "/income/:path*",
    "/analytics/:path*",
    "/budgets/:path*",
    "/recurring/:path*",
    "/crops/:path*",
    "/loans/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
    "/api/expenses/:path*",
    "/api/income/:path*",
    "/api/budgets/:path*",
    "/api/recurring/:path*",
    "/api/crops/:path*",
    "/api/loans/:path*",
    "/api/user/:path*",
  ],
};
