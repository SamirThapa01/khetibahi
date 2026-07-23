// ─────────────────────────────────────────────
//  /api/income/buyers
//  GET → distinct buyer names the logged-in farmer has ever sold to,
//        alphabetically. Powers the autocomplete on the Buyer History
//        search box so the farmer can pick from names they've already
//        typed instead of retyping one exactly.
//
//  Optional `crop` param scopes the list to buyers who've bought that
//  one crop — used by the Crops tab's per-vegetable Buyer History, so
//  the autocomplete doesn't suggest a buyer who's never bought Tomato
//  when you're standing on the Tomato page.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const crop = searchParams.get("crop")?.trim();

  await dbConnect();

  const match: Record<string, unknown> = { userId: new Types.ObjectId(user.userId) };
  if (crop) match.crop = crop;

  const buyers: string[] = await Income.distinct("buyer", match);
  buyers.sort((a, b) => a.localeCompare(b));

  return NextResponse.json(buyers);
}
