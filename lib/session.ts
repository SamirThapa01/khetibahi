// ─────────────────────────────────────────────
//  KhetiBahi – Session Helper (for API routes only)
//
//  This is deliberately a SEPARATE file from lib/auth.ts.
//  `next/headers` only works in the Node.js runtime (API
//  routes, Server Components) — NOT in Edge middleware.
//  Keeping it separate means middleware.ts can import
//  lib/auth.ts safely without dragging in Node-only code.
// ─────────────────────────────────────────────

import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyAuthToken, type AuthPayload } from "@/lib/auth";

/**
 * Read and verify the current user from the request's cookies.
 * Returns null if there's no valid session — callers decide
 * whether that means "401 Unauthorized" or "treat as guest".
 */
export async function getCurrentUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  return verifyAuthToken(token);
}
