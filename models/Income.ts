// ─────────────────────────────────────────────
//  KhetiBahi – Income Model
//  One document per sale/transaction. Same
//  `userId` pattern as Expense, so every farmer
//  only ever sees their own sales.
// ─────────────────────────────────────────────

import { Schema, models, model, Types } from "mongoose";

const CROP_VALUES = [
  "All Crops",
  "Tomato",
  "Potato",
  "Cauliflower",
  "Onion",
  "Cabbage",
  "Spinach",
  "Coriander",
  "French Bean",
  "Khursani",
  "Kakro",
  "Farshi",
  "Other",
] as const;

export interface IIncome {
  _id: string;
  userId: Types.ObjectId;
  date: string;          // "YYYY-MM-DD"
  crop: typeof CROP_VALUES[number];
  buyer: string;
  quantityKg: number;
  ratePerKg: number;
  amountPaid: number;
  note: string;
  billImage?: string; // optional receipt/bill photo, stored as a base64 data URL
  createdAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    crop: { type: String, enum: CROP_VALUES, required: true },
    buyer: { type: String, required: true, trim: true },
    quantityKg: { type: Number, required: true, min: 0 },
    ratePerKg: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, default: "", trim: true },
    billImage: { type: String, default: "" },
  },
  { timestamps: true }
);

// Speeds up the common query: "all of this user's sales, newest first"
IncomeSchema.index({ userId: 1, date: -1 });

export const Income = models.Income || model<IIncome>("Income", IncomeSchema);

export default Income;
