import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import Budget from "@/models/Budget";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { amount } = await req.json();
  await dbConnect();

  const updated = await Budget.findOneAndUpdate(
    { _id: id, userId: user.userId },
    { $set: { amount } },
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
  const deleted = await Budget.findOneAndDelete({ _id: id, userId: user.userId });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}