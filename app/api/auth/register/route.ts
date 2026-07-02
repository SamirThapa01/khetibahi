// ─────────────────────────────────────────────
//  POST /api/auth/register
//  Creates a new farmer account.
//  Body: { name, email, password }
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signAuthToken, AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // ── Validate input ──────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    // ── Reject duplicate emails ─────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Hash the password — NEVER store it plain ─
    // 10 salt rounds is bcrypt's well-tested default: strong enough to
    // resist brute-forcing, fast enough not to slow down signup.
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    // ── Log the user in immediately by issuing a token ─
    const token = await signAuthToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    const res = NextResponse.json({
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
    res.cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("register route error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
