// ─────────────────────────────────────────────
//  KhetiBahi – Loan (Udhaar) Model
//  One document per credit/loan a farmer has taken —
//  from an agrovet, cooperative, bank, or a relative/
//  neighbor. Same userId-scoping pattern as every other
//  model, and the same "paid so far vs. total" derived-
//  status idea as Income's amountPaid vs. sale total —
//  just flipped: amountRepaid grows toward `amount`
//  instead of amountPaid growing toward a sale total.
// ─────────────────────────────────────────────

import { Schema, models, model, Types } from "mongoose";

export const LOAN_SOURCES = ["Agrovet", "Cooperative", "Bank", "Relative/Neighbor", "Other"] as const;
export type LoanSource = (typeof LOAN_SOURCES)[number];

export interface ILoan {
  _id: string;
  userId: Types.ObjectId;
  lenderName: string; // e.g. "Ram Krishi Pasal", "Sunita didi"
  source: LoanSource;
  crop?: string; // optional — what the credit was taken for
  amount: number; // total credit/loan amount taken, in NPR
  amountRepaid: number; // how much has been paid back so far
  dateTaken: string; // "YYYY-MM-DD"
  dueDate?: string; // "YYYY-MM-DD" — optional
  note: string;
  billImage?: string; // optional receipt/chit photo, stored as a base64 data URL
  createdAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderName: { type: String, required: true, trim: true },
    source: { type: String, enum: LOAN_SOURCES, default: "Other" },
    crop: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountRepaid: { type: Number, required: true, min: 0, default: 0 },
    dateTaken: { type: String, required: true },
    dueDate: { type: String },
    note: { type: String, default: "", trim: true },
    billImage: { type: String, default: "" },
  },
  { timestamps: true }
);

// Speeds up the common query: "all of this user's loans, newest first"
LoanSchema.index({ userId: 1, dateTaken: -1 });

export const Loan = models.Loan || model<ILoan>("Loan", LoanSchema);

export default Loan;
