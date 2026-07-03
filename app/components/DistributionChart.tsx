"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – DistributionChart
//
//  Donut chart showing how total spend is split
//  across expense categories (Seeds 13%,
//  Fertilizer 26%, Labor 45%, etc.)
//
//  Uses a fixed-size PieChart so we can overlay
//  absolute-positioned text in the center hole —
//  ResponsiveContainer makes that hard.
// ─────────────────────────────────────────────

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { CategorySummary } from "@/app/types";
import { CATEGORIES } from "@/app/utils/constants";

interface DistributionChartProps {
  summaries: CategorySummary[];
  total: number;
}

// Custom tooltip on hover
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { pct: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface border border-line rounded-xl px-3 py-2 shadow-lift text-sm">
      <p className="font-semibold text-ink">{item.name}</p>
      <p className="text-ink-muted tabular-nums">
        NPR {item.value.toLocaleString()} · {item.payload.pct}%
      </p>
    </div>
  );
}

/** Format totals compactly: 137200 → "137.2k" */
function compactNPR(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function DistributionChart({
  summaries,
  total,
}: DistributionChartProps) {
  const data = summaries
    .filter((s) => s.total > 0)
    .map((s) => ({
      name: s.category,
      value: s.total,
      pct: total > 0 ? Math.round((s.total / total) * 100) : 0,
      color:
        CATEGORIES.find((c) => c.value === s.category)?.chart ?? "#6b7280",
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-faint text-sm">
        No expense data yet.
      </div>
    );
  }

  const SIZE = 200; // chart pixel dimensions
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <PieChart width={SIZE} height={SIZE}>
          <Pie
            data={data}
            cx={CX}
            cy={CY}
            innerRadius={58}
            outerRadius={88}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={2}
            stroke="var(--surface)"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>

        {/* Centre text overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="text-[11px] text-ink-muted font-medium">Total</span>
          <span className="text-lg font-display font-bold text-ink tabular-nums leading-tight">
            {compactNPR(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5 w-full">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-ink-muted flex-1 truncate">{item.name}</span>
            <span className="font-semibold text-ink tabular-nums">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
