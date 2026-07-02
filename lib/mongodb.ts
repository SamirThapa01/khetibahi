// ─────────────────────────────────────────────
//  KhetiBahi – MongoDB Connection
//
//  Next.js dev mode hot-reloads your code constantly.
//  Without caching, every reload would open a NEW
//  database connection, and you'd eventually hit
//  MongoDB's connection limit. So we stash the
//  connection on the `global` object, which survives
//  across hot reloads (it does NOT survive a full
//  server restart, which is fine — we just reconnect).
// ─────────────────────────────────────────────

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Add it to your .env.local file — see .env.example for the format."
  );
}

// Extend the NodeJS global type so TypeScript knows about our cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWithMongoose = global as any;

const cached: MongooseCache = globalWithMongoose.mongoose ?? { conn: null, promise: null };

/** Connect to MongoDB, reusing the cached connection if one already exists. */
export async function dbConnect(): Promise<typeof mongoose> {
  // Already connected — reuse it
  if (cached.conn) {
    return cached.conn;
  }

  // A connection attempt is already in flight — wait for it instead of starting a new one
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  globalWithMongoose.mongoose = cached;

  return cached.conn;
}
