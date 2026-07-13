import mongoose, { Schema, models, model } from "mongoose";

export interface IBudget {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  category: string;
  crop: string;
  month: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, default: "All" },
    crop: { type: String, required: true, default: "All" },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1, crop: 1, month: 1 }, { unique: true });

export default models.Budget || model<IBudget>("Budget", BudgetSchema);