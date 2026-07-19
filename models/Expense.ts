// ─────────────────────────────────────────────
//  KhetiBahi – Expense Model
//  Same shape as the old localStorage Expense type,
//  but now with a `userId` so each farmer only ever
//  sees their own data.
// ─────────────────────────────────────────────

import { Schema, models, model, Types } from "mongoose";

const CATEGORY_VALUES = [
  "Pesticide",
  "Fertilizer",
  "Seeds",
  "Labor",
  "Transport",
  "Irrigation",
  "Equipment",
  "Miscellaneous",
] as const;

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

export interface IExpense {
  _id: string;
  userId: Types.ObjectId;
  date: string;            // "YYYY-MM-DD"
  category: typeof CATEGORY_VALUES[number];
  crop: string; // "All Crops" + built-ins + whatever the farmer has added via /api/crops
  amount: number;
  note: string;
  billImage?: string; // optional receipt/bill photo, stored as a base64 data URL
  createdAt: Date;

   season?: string; 
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    category: { type: String, enum: CATEGORY_VALUES, required: true },
    crop: { type: String, trim: true, default: "All Crops" }, // no enum — custom crops from /api/crops are allowed
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", trim: true },
    billImage: { type: String, default: "" },
    season: { type: String, required: false },
  },
  { timestamps: true }
);

// Speeds up the common query: "all of this user's expenses, newest first"
ExpenseSchema.index({ userId: 1, date: -1 });

export const Expense = models.Expense || model<IExpense>("Expense", ExpenseSchema);

export default Expense;
