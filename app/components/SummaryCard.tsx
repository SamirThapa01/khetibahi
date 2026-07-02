// ─────────────────────────────────────────────
//  KhetiBahi – SummaryCard
//  One of the big "stat" cards at the top of
//  the dashboard. Accepts any icon + number.
// ─────────────────────────────────────────────

import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  iconBg: string;   // Tailwind bg class, e.g. "bg-green-100"
  iconText: string; // Tailwind text class, e.g. "text-green-700"
}

export default function SummaryCard({ label, value, sub, Icon, iconBg, iconText }: SummaryCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-5 flex items-start gap-4 shadow-soft hover:shadow-lift transition-shadow">
      <div className={`${iconBg} dark:bg-opacity-15 p-2.5 rounded-xl flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconText}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-display font-bold text-ink truncate tabular-nums">{value}</p>
        {sub && <p className="text-xs text-ink-faint mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
