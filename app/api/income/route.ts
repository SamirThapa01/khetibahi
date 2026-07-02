// ─────────────────────────────────────────────
//  /api/income
//  GET  → list the logged-in user's income/sale records
//  POST → create a new income record for the logged-in user
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income, type IIncome } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";
import { HydratedDocument } from "mongoose";

function serialize(doc: HydratedDocument<IIncome>) {
  return {
    id: doc._id.toString(),
    date: doc.date,
    crop: doc.crop,
    buyer: doc.buyer,
    quantityKg: doc.quantityKg,
    ratePerKg: doc.ratePerKg,
    amountPaid: doc.amountPaid,
    note: doc.note,
    billImage: doc.billImage || undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const income = await Income.find({ userId: user.userId }).sort({ date: -1, createdAt: -1 });
  return NextResponse.json(income.map(serialize));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { date, crop, buyer, quantityKg, ratePerKg, amountPaid, note, billImage } = body;

    if (!date || !crop || !buyer || quantityKg === undefined || ratePerKg === undefined) {
      return NextResponse.json(
        { error: "date, crop, buyer, quantityKg, and ratePerKg are required." },
        { status: 400 }
      );
    }
    if (typeof quantityKg !== "number" || quantityKg <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }
    if (typeof ratePerKg !== "number" || ratePerKg < 0) {
      return NextResponse.json({ error: "Rate must be a non-negative number." }, { status: 400 });
    }

    await dbConnect();
    const created = await Income.create({
      userId: user.userId,
      date,
      crop,
      buyer,
      quantityKg,
      ratePerKg,
      amountPaid: amountPaid ?? 0,
      note: note ?? "",
      billImage: billImage ?? "",
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error("create income error:", err);
    return NextResponse.json({ error: "Could not save income record." }, { status: 500 });
  }
}
