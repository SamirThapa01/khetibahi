import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import RecurringExpense from "@/models/RecurringExpense";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const items = await RecurringExpense.find({ userId: user.userId }).sort({ createdAt: -1 });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, crop, amount, note, frequency, dayOfMonth, dayOfWeek, startDate, endDate } = body;

  if (!category || !crop || amount === undefined || !frequency || !startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (frequency === "monthly" && !dayOfMonth) {
    return NextResponse.json({ error: "dayOfMonth is required for monthly frequency" }, { status: 400 });
  }
  if (frequency === "weekly" && dayOfWeek === undefined) {
    return NextResponse.json({ error: "dayOfWeek is required for weekly frequency" }, { status: 400 });
  }

  await dbConnect();
  const created = await RecurringExpense.create({
    userId: user.userId,
    category,
    crop,
    amount,
    note,
    frequency,
    dayOfMonth,
    dayOfWeek,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
    active: true,
  });

  return NextResponse.json(created, { status: 201 });
}