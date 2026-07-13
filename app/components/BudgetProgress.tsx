"use client";

import { BudgetProgress as BudgetProgressType } from "@/app/hooks/useBudgets";
import { formatNPR } from "@/app/utils/helpers";

export default function BudgetProgress({ budgets }: { budgets: BudgetProgressType[] }) {
  if (budgets.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No budgets set for this month yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((b) => (
        <div key={b._id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">
              {b.category}
              {b.crop !== "All" ? ` · ${b.crop}` : ""}
            </span>
            <span className={b.isOverBudget ? "text-red-500 font-semibold" : "text-gray-500"}>
              {formatNPR(b.spent)} / {formatNPR(b.amount)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                b.isOverBudget ? "bg-red-500" : b.percentUsed > 80 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
            />
          </div>
          {b.isOverBudget && (
            <p className="text-xs text-red-500 mt-1">Over by {formatNPR(Math.abs(b.remaining))}</p>
          )}
        </div>
      ))}
    </div>
  );
}