// ─────────────────────────────────────────────
//  /api/expenses/subsidy-summary
//  GET → total government subsidy (anudan) received, broken down by
//        program (Fertilizer / Seed / Irrigation / Equipment / Other),
//        for the logged-in user.
//
//  This is exactly the kind of record a cooperative or Krishi office
//  asks for when a farmer re-applies for next season's subsidy: "how
//  much anudan have you already received, and for what." Computed
//  server-side with an aggregation so it stays cheap even as the
//  expense history grows — same pattern as /api/expenses/summary.
//
//  Optional ?year=YYYY (AD year, since `date` is stored as an AD
//  "YYYY-MM-DD" string) narrows it to one year; omit for all-time.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year"); // "2026" or null for all-time

  const match: Record<string, unknown> = {
    userId: new Types.ObjectId(user.userId),
    subsidyReceived: true,
  };
  if (year && /^\d{4}$/.test(year)) {
    match.date = { $regex: `^${year}` };
  }

  const byProgram = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$subsidyProgram", "Other"] },
        totalSubsidy: { $sum: { $ifNull: ["$subsidyAmount", 0] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalSubsidy: -1 } },
  ]);

  const programs = byProgram.map((p) => ({
    program: p._id as string,
    totalSubsidy: p.totalSubsidy as number,
    count: p.count as number,
  }));

  const totalSubsidy = programs.reduce((sum, p) => sum + p.totalSubsidy, 0);
  const totalCount = programs.reduce((sum, p) => sum + p.count, 0);

  return NextResponse.json({ year: year ?? "all", programs, totalSubsidy, totalCount });
}
