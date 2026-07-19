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
  crop: string; // built-ins + whatever the farmer has added via /api/crops
  buyer: string;
  quantityKg: number;
  ratePerKg: number;
  amountPaid: number;
  note: string;
  billImage?: string; // optional receipt/bill photo, stored as a base64 data URL
  createdAt: Date;

   season?: string; 
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    crop: { type: String, trim: true, required: true }, // no enum — custom crops from /api/crops are allowed
    buyer: { type: String, required: true, trim: true },
    quantityKg: { type: Number, required: true, min: 0 },
    ratePerKg: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, default: "", trim: true },
    billImage: { type: String, default: "" },
    season: { type: String, required: false },
  },
  { timestamps: true }
);

// Speeds up the common query: "all of this user's sales, newest first"
IncomeSchema.index({ userId: 1, date: -1 });

export const Income = models.Income || model<IIncome>("Income", IncomeSchema);

export default Income;
