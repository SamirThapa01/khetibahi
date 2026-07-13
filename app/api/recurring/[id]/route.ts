import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import RecurringExpense from "@/models/RecurringExpense";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await dbConnect();

  const updated = await RecurringExpense.findOneAndUpdate(
    { _id: id, userId: user.userId },
    { $set: body },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const deleted = await RecurringExpense.findOneAndDelete({ _id: id, userId: user.userId });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}