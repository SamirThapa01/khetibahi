// ─────────────────────────────────────────────
//  /api/income/buyer
//  GET → every sale to one buyer, newest-first, so a farmer can answer
//        "what have I bought from you?" when a buyer asks.
//
//  Buyer name is matched case-insensitively but otherwise exactly
//  (not a substring search like /api/income/list?search=) — this is a
//  lookup for one specific person, not a fuzzy filter. The buyer name
//  is typed freehand on each sale (no separate Buyer model), so small
//  spelling variations across records genuinely are different buyers
//  as far as this feature is concerned; that mirrors how the Income
//  page's own table already treats buyer as a free-text field.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const buyer = searchParams.get("name")?.trim();
  if (!buyer) {
    return NextResponse.json({ error: "A buyer name is required." }, { status: 400 });
  }

  await dbConnect();

  // ^...$ anchors it to an exact (case-insensitive) match, not a substring.
  const escaped = buyer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sales = await Income.find({
    userId: user.userId,
    buyer: { $regex: `^${escaped}$`, $options: "i" },
  }).sort({ date: -1, createdAt: -1 });

  const records = sales.map((doc) => ({
    id: doc._id.toString(),
    date: doc.date,
    crop: doc.crop,
    buyer: doc.buyer,
    quantityKg: doc.quantityKg,
    ratePerKg: doc.ratePerKg,
    amount: doc.quantityKg * doc.ratePerKg,
    amountPaid: doc.amountPaid,
    note: doc.note,
  }));

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = records.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalKg = records.reduce((sum, r) => sum + r.quantityKg, 0);

  return NextResponse.json({
    buyer,
    records,
    summary: {
      totalAmount,
      totalPaid,
      totalDue: Math.max(totalAmount - totalPaid, 0),
      totalKg,
      count: records.length,
    },
  });
}
