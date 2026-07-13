"use client";

import { OutstandingDue } from "@/app/utils/helpers";
import { formatNPR } from "@/app/utils/helpers";

export default function DueReminders({ dues }: { dues: OutstandingDue[] }) {
  if (dues.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No outstanding payments — everyone's paid up. 
      </p>
    );
  }

  const totalDue = dues.reduce((sum, d) => sum + d.amountDue, 0);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-semibold">Money still owed to you</h3>
        <span className="text-red-500 font-semibold">{formatNPR(totalDue)}</span>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {dues.map((d) => (
          <li key={d.incomeId} className="py-2 flex justify-between items-center text-sm">
            <div>
              <p className="font-medium">{d.buyer} — {d.crop}</p>
              <p className="text-gray-500">
                {d.daysSince} day{d.daysSince === 1 ? "" : "s"} ago
                {d.isOverdue && <span className="text-red-500 ml-2 font-medium">Overdue</span>}
              </p>
            </div>
            <span className={d.isOverdue ? "text-red-500 font-semibold" : "font-medium"}>
              {formatNPR(d.amountDue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}