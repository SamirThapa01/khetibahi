// ─────────────────────────────────────────────
//  KhetiBahi – User Model
//  One document per signed-up farmer.
//  Password is ALWAYS stored hashed (bcrypt),
//  never in plain text.
// ─────────────────────────────────────────────

import { Schema, models, model } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  profileImage?: string; // optional profile photo, stored as a base64 data URL
  dismissedNotificationIds: string[]; // notification bell items the farmer has cleared
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,       // MongoDB enforces no two users share an email
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: "" },
    dismissedNotificationIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Reuse the existing model if it's already compiled (avoids
// "Cannot overwrite model" errors during Next.js hot reload).
export const User = models.User || model<IUser>("User", UserSchema);

export default User;
