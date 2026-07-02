// ─────────────────────────────────────────────
//  KhetiBahi – CashFlowChart
//  New: income vs. expense per month, so the
//  dashboard shows a trend, not just a snapshot.
// ─────────────────────────────────────────────

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNPR } from "@/app/utils/helpers";

interface CashFlowChartProps {
  data: { month: string; income: number; expense: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xl px-3.5 py-2.5 shadow-lift text-sm">
      <p className="font-semibold text-ink mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 tabular-nums" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{formatNPR(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-ink-faint text-sm">
        Add a sale or expense to see your cash flow trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)" }}
        />
        <Bar dataKey="income" name="Income" fill="var(--brand)" radius={[5, 5, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Expense" fill="var(--negative)" radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
