import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RecurringExpense from "@/models/RecurringExpense";
import Expense from "@/models/Expense";

function isDueToday(item: {
  frequency: "weekly" | "monthly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  lastGeneratedDate?: Date;
}, today: Date): boolean {
  if (today < item.startDate) return false;
  if (item.endDate && today > item.endDate) return false;

  if (item.lastGeneratedDate) {
    const last = new Date(item.lastGeneratedDate);
    if (
      last.getFullYear() === today.getFullYear() &&
      last.getMonth() === today.getMonth() &&
      last.getDate() === today.getDate()
    ) {
      return false;
    }
  }

  if (item.frequency === "monthly") {
    return today.getDate() === item.dayOfMonth;
  }
  return today.getDay() === item.dayOfWeek;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const today = new Date();
  const active = await RecurringExpense.find({ active: true });

  let generated = 0;
  for (const item of active) {
    if (!isDueToday(item, today)) continue;

    await Expense.create({
      userId: item.userId,
      date: today,
      category: item.category,
      crop: item.crop,
      amount: item.amount,
      note: item.note ? `${item.note} (recurring)` : "Recurring expense",
    });

    item.lastGeneratedDate = today;
    await item.save();
    generated += 1;
  }

  return NextResponse.json({ generated });
}