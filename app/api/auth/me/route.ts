// ─────────────────────────────────────────────
//  GET /api/auth/me
//  Returns the currently logged-in user (from the
//  cookie), or 401 if no one is logged in.
//  The frontend calls this once on page load to
//  restore the session after a refresh.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  // The JWT only carries name/email (kept small on purpose — see lib/auth.ts),
  // so we look up profileImage fresh from the DB each time rather than
  // baking a potentially large base64 photo into every request's cookie.
  await dbConnect();
  const doc = await User.findById(user.userId);

  return NextResponse.json({
    user: {
      id: user.userId,
      name: doc?.name ?? user.name,
      email: doc?.email ?? user.email,
      profileImage: doc?.profileImage || undefined,
    },
  });
}
