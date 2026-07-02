// ─────────────────────────────────────────────
//  /api/expenses
//  GET  → list the logged-in user's expenses
//  POST → create a new expense for the logged-in user
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Expense, type IExpense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";
import { HydratedDocument } from "mongoose";

/** Shape the frontend's `Expense` type already expects: `id` not `_id` */
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

export async function GET() {
  // NOTE: middleware.ts already blocks unauthenticated requests to this
  // path, but we check again here — never trust a single layer of defense.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const expenses = await Expense.find({ userId: user.userId }).sort({ date: -1, createdAt: -1 });
  return NextResponse.json(expenses.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { date, category, crop, amount, note, billImage } = body;

    if (!date || !category || amount === undefined || amount === null) {
      return NextResponse.json({ error: "date, category, and amount are required." }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }

    await dbConnect();
    // userId comes from the verified JWT, never from the request body —
    // otherwise anyone could pass someone else's userId and write into
    // their data.
    const created = await Expense.create({
      userId: user.userId,
      date,
      category,
      crop: crop ?? "All Crops",
      amount,
      note: note ?? "",
      billImage: billImage ?? "",
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error("create expense error:", err);
    return NextResponse.json({ error: "Could not save expense." }, { status: 500 });
  }
}
