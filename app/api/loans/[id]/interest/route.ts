// ─────────────────────────────────────────────
//  /api/loans/[id]/interest
//  POST → log a single interest payment against a loan
//
//  Kept separate from PUT /api/loans/[id] so the client
//  doesn't have to resend the whole loan just to append one
//  interest payment — a $push is also safer under concurrent
//  edits than "read the array, add one, write the whole array back."
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { date, amount } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }

    await dbConnect();

    // Same ownership-scoped query pattern as every other route in this
    // app: one query that's simultaneously "find this loan" AND "only if
    // it's yours." No match → 404, not 403.
    const updated = await Loan.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { $push: { interestPayments: { date, amount } } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      lenderName: updated.lenderName,
      source: updated.source,
      crop: updated.crop || undefined,
      amount: updated.amount,
      amountRepaid: updated.amountRepaid,
      dateTaken: updated.dateTaken,
      dueDate: updated.dueDate || undefined,
      interestRate: updated.interestRate ?? 0,
      interestPayments: updated.interestPayments ?? [],
      note: updated.note,
      billImage: updated.billImage || undefined,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("record interest payment error:", err);
    return NextResponse.json({ error: "Could not record interest payment." }, { status: 500 });
  }
}
