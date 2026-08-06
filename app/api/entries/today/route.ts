// ─────────────────────────────────────────────
//  /api/entries/today
//  GET → every income (sale) + expense record the logged-in user has
//        for ONE date (defaults to today), newest first.
//
//  Why this exists as its own endpoint instead of reusing /api/income
//  and /api/expenses: those two return the farmer's ENTIRE history
//  (every sale/expense ever), which is what the dashboard totals and
//  Analytics need. Two different jobs use this endpoint instead:
//
//   1. Dashboard "Today's Entries" widget — so whoever in the family
//      opens the app can see at a glance what's already been logged
//      today, by crop/category and buyer, before adding anything new.
//   2. The Add Sale / Add Expense forms' duplicate check — they call
//      this with whatever date is selected in the form (not just
//      today) to check "has this exact entry already been logged for
//      THIS date?" without ever pulling in the full history.
//
//  Scoped to userId like everything else — since the whole family
//  shares one login for the farm account, this naturally shows every
//  family member's entries for the day, not just whoever is looking
//  at the screen right now.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income, type IIncome } from "@/models/Income";
import { Expense, type IExpense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";
import { HydratedDocument } from "mongoose";

function serializeIncome(doc: HydratedDocument<IIncome>) {
  return {
    id: doc._id.toString(),
    date: doc.date,
    crop: doc.crop,
    buyer: doc.buyer,
    quantityKg: doc.quantityKg,
    ratePerKg: doc.ratePerKg,
    amountPaid: doc.amountPaid,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  };
}

function serializeExpense(doc: HydratedDocument<IExpense>) {
  return {
    id: doc._id.toString(),
    date: doc.date,
    category: doc.category,
    crop: doc.crop,
    amount: doc.amount,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** "YYYY-MM-DD" in the server's local time — same format the app stores `date` as. */
function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Accept whatever date the caller asks for (e.g. the date picked in a
  // form that isn't "today"), but always fall back to today.
  const dateParam = searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayISO();

  await dbConnect();

  const [income, expenses] = await Promise.all([
    Income.find({ userId: user.userId, date }).sort({ createdAt: -1 }),
    Expense.find({ userId: user.userId, date }).sort({ createdAt: -1 }),
  ]);

  return NextResponse.json({
    date,
    income: income.map(serializeIncome),
    expenses: expenses.map(serializeExpense),
  });
}
