// ─────────────────────────────────────────────
//  /api/expenses/list
//  GET → ONE PAGE of the logged-in user's expenses (10 rows by default),
//        filtered and sorted server-side.
//
//  This is a SEPARATE endpoint from /api/expenses on purpose:
//  /api/expenses still returns the full array, unchanged, because the
//  dashboard, Crops pages, and Analytics page all pull the complete
//  expense list to compute cross-page totals (profit/loss per crop,
//  monthly trends, etc.) — pagination there would silently break their
//  math. Only the Expenses page's TABLE needed pagination, so it gets
//  its own endpoint instead of changing behaviour everyone else depends on.
//
//  Response shape: { data: Expense[], page, limit, total, totalPages, filteredTotal }
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Expense, type IExpense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";
import { HydratedDocument } from "mongoose";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function serialize(doc: HydratedDocument<IExpense>) {
  return {
    id: doc._id.toString(),
    date: doc.date,
    category: doc.category,
    crop: doc.crop,
    amount: doc.amount,
    note: doc.note,
    billImage: doc.billImage || undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const limitParam = searchParams.get("limit");
  const wantsAll = limitParam === "all"; // used only for CSV export
  const limit = Math.min(
    Math.max(parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const category = searchParams.get("category");
  const crop = searchParams.get("crop");
  const month = searchParams.get("month"); // "YYYY-MM"
  const search = searchParams.get("search");

  const query: Record<string, unknown> = { userId: user.userId };
  if (category && category !== "All") query.category = category;
  if (crop && crop !== "All") query.crop = crop;
  if (month) query.date = { $regex: `^${month}` }; // date is stored as "YYYY-MM-DD"
  if (search) {
    query.$or = [
      { note: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { crop: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Expense.countDocuments(query);

  // Sum of AMOUNT across every row matching the filters (not just this
  // page) — powers the "X entries · ₹Y" header above the table.
  const sumResult = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, sum: { $sum: "$amount" } } },
  ]);
  const filteredTotal = sumResult[0]?.sum ?? 0;

  let cursor = Expense.find(query).sort({ date: -1, createdAt: -1 });
  if (!wantsAll) {
    cursor = cursor.skip((page - 1) * limit).limit(limit);
  }
  const expenses = await cursor;

  return NextResponse.json({
    data: expenses.map(serialize),
    page: wantsAll ? 1 : page,
    limit: wantsAll ? total : limit,
    total,
    totalPages: wantsAll ? 1 : Math.max(Math.ceil(total / limit), 1),
    filteredTotal,
  });
}