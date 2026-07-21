// ─────────────────────────────────────────────
//  /api/notifications
//  GET → the logged-in farmer's active notifications:
//    - loans overdue or due within the next 7 days
//    - budgets (current month) that are over their limit
//
//  Notifications are never stored — they're computed fresh
//  from Loan/Budget/Expense data every time this is called,
//  same "derive it, don't stash a copy that can go stale"
//  pattern as getLoanStatus/getPaymentStatus elsewhere in
//  this app. Only the DISMISSAL is persisted (on the User
//  doc), keyed by a deterministic id per notification so a
//  dismissed budget alert naturally reappears next month.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { Loan } from "@/models/Loan";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";
import { User } from "@/models/User";

export type NotificationSeverity = "negative" | "accent";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DUE_SOON_WINDOW_DAYS = 7;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const [dbUser, loans, budgets] = await Promise.all([
    User.findById(user.userId).select("dismissedNotificationIds"),
    Loan.find({ userId: user.userId }),
    Budget.find({ userId: user.userId, month: currentMonth() }),
  ]);

  const dismissed = new Set(dbUser?.dismissedNotificationIds ?? []);
  const notifications: AppNotification[] = [];
  const today = new Date();

  // ── Loan due dates ──
  for (const loan of loans) {
    const outstanding = loan.amount - loan.amountRepaid;
    if (outstanding <= 0 || !loan.dueDate) continue;

    const daysUntilDue = Math.floor((new Date(loan.dueDate).getTime() - today.getTime()) / MS_PER_DAY);

    if (daysUntilDue < 0) {
      const id = `loan-overdue-${loan._id}`;
      if (!dismissed.has(id)) {
        notifications.push({
          id,
          severity: "negative",
          title: `Udhaar overdue: ${loan.lenderName}`,
          message: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} past due, ${formatNPR(outstanding)} still owed.`,
          href: "/loans",
        });
      }
    } else if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) {
      const id = `loan-duesoon-${loan._id}`;
      if (!dismissed.has(id)) {
        notifications.push({
          id,
          severity: "accent",
          title: `Udhaar due soon: ${loan.lenderName}`,
          message:
            daysUntilDue === 0
              ? `Due today — ${formatNPR(outstanding)} still owed.`
              : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}, ${formatNPR(outstanding)} still owed.`,
          href: "/loans",
        });
      }
    }
  }

  // ── Budget overruns (current month) ──
  if (budgets.length > 0) {
    const monthExpenses = await Expense.find({
      userId: user.userId,
      date: { $regex: `^${currentMonth()}` },
    });

    for (const budget of budgets) {
      const id = `budget-over-${budget._id}`;
      if (dismissed.has(id)) continue;

      const spent = monthExpenses
        .filter((e) => {
          const categoryMatches = budget.category === "All" || e.category === budget.category;
          const cropMatches = budget.crop === "All" || e.crop === budget.crop;
          return categoryMatches && cropMatches;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      if (spent > budget.amount) {
        const label = [budget.category, budget.crop].filter((v) => v !== "All").join(" · ") || "Overall";
        notifications.push({
          id,
          severity: "negative",
          title: `Over budget: ${label}`,
          message: `Spent ${formatNPR(spent)} of a ${formatNPR(budget.amount)} budget this month.`,
          href: "/budgets",
        });
      }
    }
  }

  // Overdue/over-budget first, then due-soon
  notifications.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "negative" ? -1 : 1));

  return NextResponse.json(notifications);
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatNPR(amount: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}
