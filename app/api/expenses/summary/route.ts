// ─────────────────────────────────────────────
//  /api/expenses/summary
//  GET → category totals + grand total, computed in MongoDB
//
//  Why this exists as a SEPARATE endpoint:
//  The Expenses page's table now reads from /api/expenses/list, which
//  only sends 10 rows at a time — so the page no longer has the full
//  expense list in memory to sum categories or grand totals from.
//  Rather than fetch every page just to add numbers together, we ask
//  MongoDB to do the sum server-side with an aggregation pipeline and
//  send back just the small result (a handful of numbers), not rows.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";
import { Types } from "mongoose";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const byCategory = await Expense.aggregate([
    { $match: { userId: new Types.ObjectId(user.userId) } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Raw per-category totals only — NOT the final CategorySummary[] shape.
  // The frontend already has CATEGORIES (labels/colors) in a constants
  // file, so we just send numbers and let buildCategorySummariesFromTotals()
  // fill in zero-totals for categories with no spend + attach colors.
  const categoryTotals = byCategory.map((c) => ({
    category: c._id as string,
    total: c.total as number,
    count: c.count as number,
  }));

  const totalSpend = categoryTotals.reduce((acc, c) => acc + c.total, 0);

  return NextResponse.json({ categoryTotals, totalSpend });
}