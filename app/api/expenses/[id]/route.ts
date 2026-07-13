// ─────────────────────────────────────────────
//  /api/expenses/[id]
//  PUT    → update one expense (must belong to the logged-in user)
//  DELETE → delete one expense (must belong to the logged-in user)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { date, category, crop, amount, note, billImage, season} = body;

    await dbConnect();

    // The userId filter here does double duty: it's both "find this
    // document" AND "only if it belongs to you" — one query, no
    // separate ownership check needed, and no information leak about
    // whether the id exists but belongs to someone else.
    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { date, category, crop, amount, note, billImage: billImage ?? "",season: season || undefined  },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      date: updated.date,
      category: updated.category,
      crop: updated.crop,
      amount: updated.amount,
      note: updated.note,
      billImage: updated.billImage || undefined,
       season: updated.season || undefined,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("update expense error:", err);
    return NextResponse.json({ error: "Could not update expense." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await dbConnect();

    const deleted = await Expense.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deleted) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete expense error:", err);
    return NextResponse.json({ error: "Could not delete expense." }, { status: 500 });
  }
}
