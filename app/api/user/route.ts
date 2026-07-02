// ─────────────────────────────────────────────
//  /api/user
//  PUT → update the logged-in user's profile
//        (name and/or profile photo). Email and
//        password are intentionally not editable
//        here — that's a bigger, separate flow.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, profileImage } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (profileImage !== undefined && typeof profileImage !== "string") {
      return NextResponse.json({ error: "Invalid profile photo." }, { status: 400 });
    }

    await dbConnect();

    const update: { name?: string; profileImage?: string } = {};
    if (name !== undefined) update.name = name.trim();
    if (profileImage !== undefined) update.profileImage = profileImage;

    const updated = await User.findByIdAndUpdate(user.userId, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        profileImage: updated.profileImage || undefined,
      },
    });
  } catch (err) {
    console.error("update user error:", err);
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
