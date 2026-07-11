// ─────────────────────────────────────────────
//  /api/income/list
//  GET → ONE PAGE of the logged-in user's sales (10 rows by default),
//        filtered and sorted server-side.
//
//  Separate from /api/income for the same reason as /api/expenses/list:
//  the dashboard, Crops pages, and Analytics page need the FULL sales
//  history to compute cross-page totals, so /api/income keeps returning
//  everything, unpaginated, exactly as before. Only the Income page's
//  table gets this dedicated paginated endpoint.
//
//  Why aggregate() instead of find():
//  `status` (Paid / Partial / Due) is never stored — it's derived from
//  amountPaid vs. quantityKg × ratePerKg (see getPaymentStatus() in
//  helpers.ts). To let the DATABASE filter by status (so pagination
//  numbers stay correct), we recompute that same derivation with
//  $addFields, then $match on it. Keep this logic in sync with
//  getPaymentStatus() if that formula ever changes.
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";
import { PipelineStage, Types } from "mongoose";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function serialize(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    date: doc.date,
    crop: doc.crop,
    buyer: doc.buyer,
    quantityKg: doc.quantityKg,
    ratePerKg: doc.ratePerKg,
    amountPaid: doc.amountPaid,
    note: doc.note,
    billImage: doc.billImage || undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const limitParam = searchParams.get("limit");
  const wantsAll = limitParam === "all"; // used only for CSV export
  const limit = Math.min(
    Math.max(parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const crop = searchParams.get("crop");
  const month = searchParams.get("month"); // "YYYY-MM"
  const search = searchParams.get("search");
  const status = searchParams.get("status"); // "Paid" | "Partial" | "Due"

  const preMatch: Record<string, unknown> = { userId: new Types.ObjectId(user.userId) };
  if (crop && crop !== "All") preMatch.crop = crop;
  if (month) preMatch.date = { $regex: `^${month}` };
  if (search) {
    preMatch.$or = [
      { buyer: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
      { crop: { $regex: search, $options: "i" } },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: preMatch },
    { $addFields: { saleTotal: { $multiply: ["$quantityKg", "$ratePerKg"] } } },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              { case: { $lte: ["$amountPaid", 0] }, then: "Due" },
              { case: { $gte: ["$amountPaid", "$saleTotal"] }, then: "Paid" },
            ],
            default: "Partial",
          },
        },
      },
    },
  ];

  if (status && status !== "All") {
    pipeline.push({ $match: { status } });
  }

  pipeline.push({ $sort: { date: -1, createdAt: -1 } });

  // Count + sum saleTotal across every matching row (not just this page) —
  // powers the "X sales · ₹Y" header above the table.
  const countResult = await Income.aggregate([...pipeline, { $count: "total" }]);
  const total = countResult[0]?.total ?? 0;

  const sumResult = await Income.aggregate([
    ...pipeline,
    { $group: { _id: null, sum: { $sum: "$saleTotal" } } },
  ]);
  const filteredTotal = sumResult[0]?.sum ?? 0;

  if (!wantsAll) {
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
  }

  const docs = await Income.aggregate(pipeline);

  return NextResponse.json({
    data: docs.map(serialize),
    page: wantsAll ? 1 : page,
    limit: wantsAll ? total : limit,
    total,
    totalPages: wantsAll ? 1 : Math.max(Math.ceil(total / limit), 1),
    filteredTotal,
  });
}