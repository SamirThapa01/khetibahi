// ─────────────────────────────────────────────
//  KhetiBahi – Signup Page
// ─────────────────────────────────────────────

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const result = await signup(name, email, password);

    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Signup failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand text-white shadow-soft mb-4">
            <Sprout className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-display font-bold text-ink">Create your account</h1>
          <p className="text-sm text-ink-muted mt-1">Start tracking your farm&apos;s money, simply</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-line shadow-soft p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Full name</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Samir Karki"
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {error && (
            <p className="text-sm text-negative bg-negative-soft rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
