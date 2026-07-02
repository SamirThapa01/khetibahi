// ─────────────────────────────────────────────
//  KhetiBahi – JWT Auth Helpers
//
//  WHY "jose" AND NOT THE "jsonwebtoken" PACKAGE?
//  This file is imported by both our API routes
//  (full Node.js) AND proxy.ts (Next.js 16's
//  request-interception file, which runs on the
//  Node.js runtime by default but historically ran
//  on a stripped-down Edge runtime in older Next.js
//  versions). "jose" is built on the Web Crypto API,
//  so it works correctly in EITHER environment — one
//  auth library, no surprises if the runtime changes
//  under us later.
//
//  THE TOKEN ITSELF:
//  A JWT is just a signed, base64 string with 3
//  parts: header.payload.signature — e.g.
//  "eyJhbGc...​.eyJ1c2Vy...​.4f9c2a...". Anyone can
//  read the payload (it's NOT encrypted, just
//  signed), so we only ever put non-secret data in
//  it (userId, name, email). The signature proves
//  WE issued it — only someone holding JWT_SECRET
//  can produce a signature that verifies correctly.
//  We store the secret only on the server, in
//  process.env.JWT_SECRET — never sent to the browser.
// ─────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "Missing JWT_SECRET environment variable. Add it to your .env.local file — see .env.example."
  );
}

// jose wants the secret as raw bytes, not a string
const secretKey = new TextEncoder().encode(JWT_SECRET);

/** Name of the cookie that carries the JWT in the browser */
export const AUTH_COOKIE = "khetibahi_token";

/** How long a login session lasts before the user must log in again */
const TOKEN_TTL = "7d";

/** The data we trust enough to embed inside the token, unencrypted */
export interface AuthPayload {
  userId: string;
  name: string;
  email: string;
}

/** Sign a brand-new JWT for a user who just logged in / signed up */
export async function signAuthToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey);
}

/**
 * Verify a JWT and return its payload, or `null` if it's missing,
 * expired, or tampered with. Never throws — callers just check for null.
 */
export async function verifyAuthToken(token: string | undefined): Promise<AuthPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    // Defensive narrowing: confirm the shape is really what we expect
    if (
      typeof payload.userId === "string" &&
      typeof payload.name === "string" &&
      typeof payload.email === "string"
    ) {
      return { userId: payload.userId, name: payload.name, email: payload.email };
    }
    return null;
  } catch {
    // Covers: expired token, bad signature, malformed token
    return null;
  }
}

/** Shared cookie settings so login/register/logout all agree on the same rules */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true as const, // JavaScript in the browser can NEVER read this cookie — blocks XSS token theft
  secure: process.env.NODE_ENV === "production", // HTTPS-only in production; allow plain HTTP for local dev
  sameSite: "lax" as const, // sent on normal navigation, blocked on cross-site form posts — solid CSRF baseline
  path: "/",
};
