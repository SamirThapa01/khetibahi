KhetiBahi Commit Tracker

Rule: 2-3 items per day. Check [ ] -> [x] only after git commit, not before.
This file is auto-updated by scripts/update-tracker.sh — it reads real git
history, so it can never be "wrong" or "forgotten to update."

Legend: ⬜ not committed yet | ✅ committed


[Auth] Authentication & Session


⬜ lib/auth.ts
⬜ lib/session.ts
⬜ app/context/AuthContext.tsx
⬜ app/api/auth/login/route.ts
⬜ app/api/auth/logout/route.ts
⬜ app/api/auth/register/route.ts
⬜ app/api/auth/me/route.ts
⬜ proxy.ts
⬜ app/login/page.tsx
⬜ app/signup/page.tsx


[DB] Database Models


⬜ lib/mongodb.ts
⬜ models/User.ts
⬜ models/Income.ts
⬜ models/Expense.ts


[Layout] Shell / Navigation


⬜ app/layout.tsx
⬜ app/components/LayoutShell.tsx
⬜ app/components/Sidebar.tsx
⬜ app/components/TopBar.tsx
⬜ app/components/Navbar.tsx


[Expenses] Expense Tracking


⬜ app/expenses/page.tsx
⬜ app/components/ExpenseForm.tsx
⬜ app/components/ExpenseRow.tsx
⬜ app/hooks/useExpenses.ts
⬜ app/api/expenses/route.ts
⬜ app/api/expenses/[id]/route.ts


[Income] Income & Payments


⬜ app/income/page.tsx
⬜ app/components/IncomeForm.tsx
⬜ app/components/IncomeRow.tsx
⬜ app/components/IncomeFilterBar.tsx
⬜ app/components/RecordPaymentModal.tsx
⬜ app/hooks/useIncome.ts
⬜ app/api/income/route.ts
⬜ app/api/income/[id]/route.ts


[Crops] Crop Analytics


⬜ app/crops/page.tsx
⬜ app/crops/[crop]/page.tsx
⬜ app/crops/[crop]/CropDetailClient.tsx


[Charts] Data Visualization


⬜ app/components/CashFlowChart.tsx
⬜ app/components/CategoryChart.tsx
⬜ app/components/DistributionChart.tsx
⬜ app/components/MonthlyTrendChart.tsx
⬜ app/components/SummaryCard.tsx
⬜ app/analytics/page.tsx


[Profile] User Profile & Images


⬜ app/profile/page.tsx
⬜ app/components/AvatarUpload.tsx
⬜ app/components/ImageUploadField.tsx
⬜ app/components/ImageLightbox.tsx
⬜ app/utils/imageUpload.ts


[UI] Shared UI / Utils


⬜ app/components/FilterBar.tsx
⬜ app/hooks/useDarkMode.ts
⬜ app/utils/constants.ts
⬜ app/utils/helpers.ts
⬜ app/types/index.ts
⬜ app/api/user/route.ts
⬜ app/page.tsx



Suggested 15-Day Plan (2-3 per day)

DayScope tag to useFiles1[DB]lib/mongodb.ts, models/User.ts, models/Income.ts2[DB] [Auth]models/Expense.ts, lib/auth.ts, lib/session.ts3[Auth]app/context/AuthContext.tsx, proxy.ts4[Auth]app/api/auth/login/route.ts, app/api/auth/register/route.ts5[Auth]app/api/auth/logout/route.ts, app/api/auth/me/route.ts, app/login/page.tsx6[Auth] [Layout]app/signup/page.tsx, app/layout.tsx7[Layout]app/components/LayoutShell.tsx, app/components/Sidebar.tsx, app/components/TopBar.tsx8[Layout] [Expenses]app/components/Navbar.tsx, app/expenses/page.tsx9[Expenses]app/components/ExpenseForm.tsx, app/components/ExpenseRow.tsx, app/hooks/useExpenses.ts10[Expenses]app/api/expenses/route.ts, app/api/expenses/[id]/route.ts11[Income]app/income/page.tsx, app/components/IncomeForm.tsx, app/components/IncomeRow.tsx12[Income]app/components/IncomeFilterBar.tsx, app/components/RecordPaymentModal.tsx13[Income]app/hooks/useIncome.ts, app/api/income/route.ts, app/api/income/[id]/route.ts14[Crops]app/crops/page.tsx, app/crops/[crop]/page.tsx, app/crops/[crop]/CropDetailClient.tsx15[Charts]app/components/CashFlowChart.tsx, app/components/CategoryChart.tsx, app/components/DistributionChart.tsx

(Days 16+ would cover [Charts] remainder, [Profile], and [UI] — run the plan
generator again if you want it extended.)