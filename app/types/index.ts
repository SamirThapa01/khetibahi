// ─────────────────────────────────────────────
//  KhetiBahi – Type Definitions
//  All shared types live here so every component
//  speaks the same language.
// ─────────────────────────────────────────────

/** Every expense category we support */
export type ExpenseCategory =
  | "Pesticide"
  | "Fertilizer"
  | "Seeds"
  | "Labor"
  | "Transport"
  | "Irrigation"
  | "Equipment"
  | "Miscellaneous";

/**
 * Crops the farmer might track. This used to be a fixed union of names,
 * but farmers can now add their own vegetables (see app/hooks/useCrops.ts
 * and /api/crops), so it's just `string` — the built-in list in
 * app/utils/constants.ts is a set of *defaults*, not the full set anymore.
 */
export type CropType = string;

/** A single expense record */
export interface Expense {
  id: string;           // UUID  — unique forever
  date: string;         // ISO date string "YYYY-MM-DD"
  category: ExpenseCategory;
  crop: CropType | "All Crops";
  amount: number;       // in NPR (₹)
  note: string;
  billImage?: string;   // optional receipt/bill photo, stored as a base64 data URL
  createdAt: string;    // ISO timestamp — when the user added it
  
  season?: string;
}

/** What the add/edit form holds before it becomes an Expense */
export type ExpenseFormData = Omit<Expense, "id" | "createdAt">;

/** A single sale / income record — money coming IN from selling crops */
export interface Income {
  id: string;
  date: string;          // "YYYY-MM-DD"
  crop: CropType;        // income is always tied to a specific crop (no "All Crops" here)
  buyer: string;         // name of the person/shop who bought it
  quantityKg: number;    // how many kilograms were sold
  ratePerKg: number;     // price per kg, in NPR
  amountPaid: number;    // how much the buyer has actually paid so far
  note: string;
  billImage?: string;    // optional receipt/bill photo, stored as a base64 data URL
  createdAt: string;
  season?: string;
}

/** What the add/edit income form holds before it becomes an Income record */
export type IncomeFormData = Omit<Income, "id" | "createdAt">;

/**
 * Payment status for a sale. This is always DERIVED from
 * amountPaid vs. (quantityKg × ratePerKg) — never stored directly —
 * so it can never drift out of sync with the actual numbers.
 *   "Due"     → nothing received yet (amountPaid === 0)
 *   "Partial" → something received, but less than the total
 *   "Paid"    → amountPaid >= total
 */
export type PaymentStatus = "Paid" | "Partial" | "Due";

/** Summary shape used by the dashboard cards */
export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  color: string;        // Tailwind bg class for badges
}

/** Monthly roll-up */
export interface MonthlySummary {
  month: string;        // "Jan 2025"
  total: number;
  categories: Record<ExpenseCategory, number>;
}

/** Profit/loss for one crop: what came in vs what went out */
export interface CropProfitLoss {
  crop: CropType;
  income: number;        // total amount earned (rate × kg, regardless of paid/due)
  expense: number;       // total spent on this crop (excludes "All Crops" expenses)
  profit: number;        // income - expense (can be negative = loss)
  quantitySoldKg: number;
  amountDue: number;     // total still owed by buyers for this crop
}

/** One row in the "who owes what" list shown in Analytics */
export interface BuyerDue {
  buyer: string;
  crop: CropType;
  totalDue: number;
  saleCount: number;
  oldestDueDate: string; // ISO date of the oldest unpaid/partial sale
}

/** Rolled-up totals per payment status, used for the Income page + Analytics */
export interface PaymentStatusSummary {
  status: PaymentStatus;
  total: number;   // sum of (rate × kg) for sales in this status
  count: number;
}

/**
 * Where a loan/credit (udhaar) came from. "Udhaar" — buying pesticide or
 * seed on credit from the local agrovet, or borrowing from a cooperative
 * or a relative — is one of the most common ways Nepali smallholder
 * farmers finance a season, so it gets its own first-class record rather
 * than being force-fit into Expense or Income.
 */
export type LoanSource = "Agrovet" | "Cooperative" | "Bank" | "Relative/Neighbor" | "Other";

/**
 * A single credit/loan record — money the farmer OWES, not earns.
 * Mirrors Income's amountPaid/total shape, just flipped: amountRepaid
 * grows toward `amount` instead of amountPaid growing toward a sale total.
 */
export interface Loan {
  id: string;
  lenderName: string;    // e.g. "Ram Krishi Pasal", "Sunita didi"
  source: LoanSource;
  crop?: string;          // optional — what the credit was taken for
  amount: number;          // total credit/loan amount taken, in NPR
  amountRepaid: number;    // how much has been paid back so far
  dateTaken: string;       // "YYYY-MM-DD"
  dueDate?: string;        // "YYYY-MM-DD" — optional
  note: string;
  billImage?: string;      // optional receipt/chit photo, stored as a base64 data URL
  createdAt: string;
}

/** What the add/edit loan form holds before it becomes a Loan record */
export type LoanFormData = Omit<Loan, "id" | "createdAt">;

/** Rolled-up totals per repayment status, mirrors PaymentStatusSummary */
export interface LoanStatusSummary {
  status: PaymentStatus;
  total: number;   // sum of loan amounts in this status
  count: number;
}

