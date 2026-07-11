// ─────────────────────────────────────────────
//  /api/income/summary
//  GET → totalIncome, totalDue, and Paid/Partial/Due bucket totals,
//        computed in MongoDB over the user's FULL sales history
//        (independent of table pagination/filters — same behaviour
//        as the old client-side totals, which always summed `income`,
//        never `filteredIncome`).
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Income } from "@/models/Income";
import { getCurrentUser } from "@/lib/session";
import { PipelineStage, Types } from "mongoose";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const pipeline: PipelineStage[] = [
    { $match: { userId: new Types.ObjectId(user.userId) } },
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
    {
      $group: {
        _id: "$status",
        total: { $sum: "$saleTotal" },
        count: { $sum: 1 },
      },
    },
  ];

  const buckets = await Income.aggregate(pipeline);

  const statusSummary = (["Paid", "Partial", "Due"] as const).map((status) => {
    const match = buckets.find((b) => b._id === status);
    return { status, total: match?.total ?? 0, count: match?.count ?? 0 };
  });

  const totalIncome = statusSummary.reduce((acc, s) => acc + s.total, 0);
  // Due bucket is fully unpaid; Partial bucket is partly unpaid — total due
  // needs amountPaid subtracted, so we can't just reuse the bucket totals
  // for that number. Compute it directly instead.
  const dueAgg = await Income.aggregate([
    { $match: { userId: new Types.ObjectId(user.userId) } },
    {
      $group: {
        _id: null,
        totalDue: { $sum: { $subtract: [{ $multiply: ["$quantityKg", "$ratePerKg"] }, "$amountPaid"] } },
      },
    },
  ]);
  const totalDue = dueAgg[0]?.totalDue ?? 0;

  return NextResponse.json({ totalIncome, totalDue, statusSummary });
}