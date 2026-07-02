// ─────────────────────────────────────────────
//  POST /api/auth/login
//  Body: { email, password }
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signAuthToken, AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    // Deliberately vague error message — same wording whether the email
    // doesn't exist or the password is wrong. This stops an attacker from
    // using your login form to discover which emails have accounts.
    const invalidMsg = { error: "Invalid email or password." };
    if (!user) {
      return NextResponse.json(invalidMsg, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(invalidMsg, { status: 401 });
    }

    const token = await signAuthToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || undefined,
      },
    });
    res.cookies.set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("login route error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
