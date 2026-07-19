// ─────────────────────────────────────────────
//  KhetiBahi – Crop Model
//  Farmer-added vegetables/crops beyond the built-in
//  list in app/utils/constants.ts. Each farmer only
//  ever sees (and can add to) their own custom list.
// ─────────────────────────────────────────────

import { Schema, models, model, Types } from "mongoose";

export interface ICrop {
  _id: string;
  userId: Types.ObjectId;
  name: string;   // e.g. "Bhindi", "Karela" — farmer-typed, must be unique per farmer
  emoji: string;  // e.g. "🥒" — farmer-picked
  createdAt: Date;
}

const CropSchema = new Schema<ICrop>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    emoji: { type: String, required: true, trim: true, default: "🌱" },
  },
  { timestamps: true }
);

// A farmer can't add the same crop name twice (case-sensitive on purpose —
// keeps it simple; the API lowercases-compares before insert, see route.ts)
CropSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Crop = models.Crop || model<ICrop>("Crop", CropSchema);

export default Crop;
