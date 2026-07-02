// ─────────────────────────────────────────────
//  KhetiBahi – CategoryChart
//  Recharts bar chart showing spend by category
// ─────────────────────────────────────────────

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CategorySummary } from "@/app/types";
import { CATEGORIES } from "@/app/utils/constants";
import { formatNPR } from "@/app/utils/helpers";

interface CategoryChartProps {
  summaries: CategorySummary[];
}

// Custom tooltip shown on hover
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface border border-line rounded-xl px-3.5 py-2.5 shadow-lift text-sm">
      <p className="font-semibold text-ink">{item.name}</p>
      <p className="text-brand font-bold tabular-nums">{formatNPR(item.value)}</p>
    </div>
  );
}

export default function CategoryChart({ summaries }: CategoryChartProps) {
  // Filter to only categories with actual spend
  const data = summaries
    .filter((s) => s.total > 0)
    .map((s) => ({
      name: s.category,
      value: s.total,
      color: CATEGORIES.find((c) => c.value === s.category)?.chart ?? "#6b7280",
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-faint text-sm">
        No expense data yet. Add your first expense!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="value" name="Spent" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
