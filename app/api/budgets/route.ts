import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import Budget from "@/models/Budget";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const month = req.nextUrl.searchParams.get("month");

  const query: Record<string, unknown> = { userId: user.userId };
  if (month) query.month = month;

  const budgets = await Budget.find(query).sort({ month: -1, category: 1 });
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category = "All", crop = "All", month, amount } = body;

  if (!month || amount === undefined) {
    return NextResponse.json({ error: "month and amount are required" }, { status: 400 });
  }

  await dbConnect();

  const budget = await Budget.findOneAndUpdate(
    { userId: user.userId, category, crop, month },
    { $set: { amount } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json(budget, { status: 201 });
}