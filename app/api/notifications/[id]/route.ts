// ─────────────────────────────────────────────
//  /api/notifications/[id]
//  DELETE → dismiss one notification for the logged-in farmer
//
//  Notifications aren't their own DB record — see /api/notifications
//  for how they're computed. "Dismissing" one just remembers its id
//  on the User doc so it's filtered out next time, capped at the most
//  recent 300 so this array doesn't grow forever.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { User } from "@/models/User";

const MAX_DISMISSED = 300;

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  await User.findByIdAndUpdate(user.userId, {
    $push: {
      dismissedNotificationIds: {
        $each: [id],
        $slice: -MAX_DISMISSED,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
