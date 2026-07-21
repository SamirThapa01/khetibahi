// ─────────────────────────────────────────────
//  /api/loans
//  GET  → list the logged-in farmer's loans/udhaar
//  POST → create a new loan for the logged-in farmer
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Loan, type ILoan, LOAN_SOURCES } from "@/models/Loan";
import { getCurrentUser } from "@/lib/session";
import { HydratedDocument } from "mongoose";

/** Shape the frontend's `Loan` type expects: `id` not `_id` */
function serialize(doc: HydratedDocument<ILoan>) {
  return {
    id: doc._id.toString(),
    lenderName: doc.lenderName,
    source: doc.source,
    crop: doc.crop || undefined,
    amount: doc.amount,
    amountRepaid: doc.amountRepaid,
    dateTaken: doc.dateTaken,
    dueDate: doc.dueDate || undefined,
    interestRate: doc.interestRate ?? 0,
    interestPayments: doc.interestPayments ?? [],
    note: doc.note,
    billImage: doc.billImage || undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET() {
  // NOTE: proxy.ts should also gate this path (see matcher config) — but
  // we check again here regardless, same "never trust a single layer of
  // defense" rule every other route in this app follows.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const loans = await Loan.find({ userId: user.userId }).sort({ dateTaken: -1, createdAt: -1 });
  return NextResponse.json(loans.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { lenderName, source, crop, amount, amountRepaid, dateTaken, dueDate, interestRate, note, billImage } = body;

    if (!lenderName || typeof lenderName !== "string" || !lenderName.trim()) {
      return NextResponse.json({ error: "Lender name is required." }, { status: 400 });
    }
    if (!dateTaken || typeof dateTaken !== "string") {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    if (
      amountRepaid !== undefined &&
      (typeof amountRepaid !== "number" || amountRepaid < 0 || amountRepaid > amount)
    ) {
      return NextResponse.json(
        { error: "Amount repaid can't be negative or exceed the loan amount." },
        { status: 400 }
      );
    }
    if (interestRate !== undefined && (typeof interestRate !== "number" || interestRate < 0)) {
      return NextResponse.json({ error: "Interest rate can't be negative." }, { status: 400 });
    }
    if (source !== undefined && !LOAN_SOURCES.includes(source)) {
      return NextResponse.json({ error: "Invalid source." }, { status: 400 });
    }

    await dbConnect();
    // userId comes from the verified JWT, never from the request body —
    // otherwise anyone could pass someone else's userId and write into
    // their data.
    const created = await Loan.create({
      userId: user.userId,
      lenderName: lenderName.trim(),
      source: source ?? "Other",
      crop: crop || undefined,
      amount,
      amountRepaid: amountRepaid ?? 0,
      dateTaken,
      dueDate: dueDate || undefined,
      interestRate: interestRate ?? 0,
      note: note ?? "",
      billImage: billImage ?? "",
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error("create loan error:", err);
    return NextResponse.json({ error: "Could not save loan." }, { status: 500 });
  }
}
