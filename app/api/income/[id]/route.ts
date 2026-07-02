// ─────────────────────────────────────────────
//  /api/income/[id]
//  PUT    → update one income record (must belong to the logged-in user)
//  DELETE → delete one income record (must belong to the logged-in user)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { date, crop, buyer, quantityKg, ratePerKg, amountPaid, note, billImage } = body;

    await dbConnect();

    const updated = await Income.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { date, crop, buyer, quantityKg, ratePerKg, amountPaid, note, billImage: billImage ?? "" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Income record not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      date: updated.date,
      crop: updated.crop,
      buyer: updated.buyer,
      quantityKg: updated.quantityKg,
      ratePerKg: updated.ratePerKg,
      amountPaid: updated.amountPaid,
      note: updated.note,
      billImage: updated.billImage || undefined,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("update income error:", err);
    return NextResponse.json({ error: "Could not update income record." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await dbConnect();

    const deleted = await Income.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deleted) {
      return NextResponse.json({ error: "Income record not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete income error:", err);
    return NextResponse.json({ error: "Could not delete income record." }, { status: 500 });
  }
}
