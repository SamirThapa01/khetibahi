// ─────────────────────────────────────────────
//  /api/income/buyers
//  GET → distinct buyer names the logged-in farmer has ever sold to,
//        alphabetically. Powers the autocomplete on the Buyer History
//        search box so the farmer can pick from names they've already
//        typed instead of retyping one exactly.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";
import { Types } from "mongoose";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const buyers: string[] = await Income.distinct("buyer", { userId: new Types.ObjectId(user.userId) });
  buyers.sort((a, b) => a.localeCompare(b));

  return NextResponse.json(buyers);
}
