// ─────────────────────────────────────────────
//  /api/crops
//  GET  → list the logged-in farmer's custom crops
//  POST → add a new custom crop (name + emoji)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Crop, type ICrop } from "@/models/Crop";
import { getCurrentUser } from "@/lib/session";
import { CROPS } from "@/app/utils/constants";
import { HydratedDocument } from "mongoose";

function serialize(doc: HydratedDocument<ICrop>) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    emoji: doc.emoji,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const crops = await Crop.find({ userId: user.userId }).sort({ name: 1 });
  return NextResponse.json(crops.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const emoji = (body.emoji ?? "🌱").toString().trim();

    if (!name) {
      return NextResponse.json({ error: "Vegetable name is required." }, { status: 400 });
    }
    if (name.length > 40) {
      return NextResponse.json({ error: "Name is too long." }, { status: 400 });
    }

    // Don't let a farmer re-add a name that's already built-in (case-insensitive)
    const builtIn = CROPS.some((c) => c.value.toLowerCase() === name.toLowerCase());
    if (builtIn) {
      return NextResponse.json(
        { error: "That vegetable is already in the built-in list." },
        { status: 409 }
      );
    }

    await dbConnect();

    // Also block duplicates against this farmer's own custom list (case-insensitive)
    const existing = await Crop.findOne({
      userId: user.userId,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json(serialize(existing), { status: 200 });
    }

    const created = await Crop.create({ userId: user.userId, name, emoji });
    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error("create crop error:", err);
    return NextResponse.json({ error: "Could not save vegetable." }, { status: 500 });
  }
}
