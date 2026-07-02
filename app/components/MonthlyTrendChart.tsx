// ─────────────────────────────────────────────
//  KhetiBahi – MonthlyTrendChart
//  Area chart showing total spend per month,
//  oldest → newest, left to right.
// ─────────────────────────────────────────────

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlySummary } from "@/app/types";
import { formatNPR } from "@/app/utils/helpers";

interface MonthlyTrendChartProps {
  summaries: MonthlySummary[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xl px-3.5 py-2.5 shadow-lift text-sm">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-brand font-bold tabular-nums">{formatNPR(payload[0].value)}</p>
    </div>
  );
}

export default function MonthlyTrendChart({ summaries }: MonthlyTrendChartProps) {
  // Reverse so oldest is left, newest is right (summaries comes newest-first)
  const data = [...summaries].reverse().map((s) => ({ month: s.month, total: s.total }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-faint text-sm">
        No monthly data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" stroke="var(--brand)" strokeWidth={2.5} fill="url(#totalGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
