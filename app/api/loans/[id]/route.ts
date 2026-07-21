// ─────────────────────────────────────────────
//  /api/loans/[id]
//  PUT    → update one loan (must belong to the logged-in user)
//  DELETE → delete one loan (must belong to the logged-in user)
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Loan, LOAN_SOURCES } from "@/models/Loan";
import { getCurrentUser } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { lenderName, source, crop, amount, amountRepaid, dateTaken, dueDate, interestRate, note, billImage } = body;

    if (source !== undefined && !LOAN_SOURCES.includes(source)) {
      return NextResponse.json({ error: "Invalid source." }, { status: 400 });
    }
    if (
      typeof amount === "number" &&
      typeof amountRepaid === "number" &&
      (amountRepaid < 0 || amountRepaid > amount)
    ) {
      return NextResponse.json(
        { error: "Amount repaid can't be negative or exceed the loan amount." },
        { status: 400 }
      );
    }
    if (interestRate !== undefined && (typeof interestRate !== "number" || interestRate < 0)) {
      return NextResponse.json({ error: "Interest rate can't be negative." }, { status: 400 });
    }

    await dbConnect();

    // Same ownership-scoped query pattern as every other model in this
    // app: one query that's simultaneously "find this record" AND "only
    // if it's yours." No match → 404, not 403, so a farmer probing other
    // people's loan IDs can't even tell whether the ID exists.
    const updated = await Loan.findOneAndUpdate(
      { _id: id, userId: user.userId },
      {
        lenderName: typeof lenderName === "string" ? lenderName.trim() : lenderName,
        source,
        crop: crop || undefined,
        amount,
        amountRepaid,
        dateTaken,
        dueDate: dueDate || undefined,
        interestRate: interestRate ?? 0,
        note,
        billImage: billImage ?? "",
      },
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
    console.error("update loan error:", err);
    return NextResponse.json({ error: "Could not update loan." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await dbConnect();

    const deleted = await Loan.findOneAndDelete({ _id: id, userId: user.userId });
    if (!deleted) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete loan error:", err);
    return NextResponse.json({ error: "Could not delete loan." }, { status: 500 });
  }
}
