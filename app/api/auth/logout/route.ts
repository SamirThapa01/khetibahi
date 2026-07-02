// ─────────────────────────────────────────────
//  POST /api/auth/logout
//  Clears the auth cookie. No body needed.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Setting maxAge 0 tells the browser to delete the cookie immediately
  res.cookies.set(AUTH_COOKIE, "", { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
