import mongoose, { Schema, models, model } from "mongoose";

export type Frequency = "weekly" | "monthly";

export interface IRecurringExpense {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  category: string;
  crop: string;
  amount: number;
  note?: string;
  frequency: Frequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  lastGeneratedDate?: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    crop: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String },
    frequency: { type: String, enum: ["weekly", "monthly"], required: true },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    lastGeneratedDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.RecurringExpense ||
  model<IRecurringExpense>("RecurringExpense", RecurringExpenseSchema);