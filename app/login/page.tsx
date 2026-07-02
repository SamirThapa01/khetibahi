// ─────────────────────────────────────────────
//  KhetiBahi – Login Page
// ─────────────────────────────────────────────

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);

    if (result.ok) {
      // If middleware redirected the user here from a protected page
      // (e.g. they tried /expenses while logged out), send them back there.
      const from = searchParams.get("from");
      router.push(from && from.startsWith("/") ? from : "/");
    } else {
      setError(result.error ?? "Login failed.");
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
          <h1 className="text-2xl font-display font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-muted mt-1">Log in to your KhetiBahi ledger</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-line shadow-soft p-6 space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          New to KhetiBahi?{" "}
          <Link href="/signup" className="text-brand font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Suspense is required around anything using useSearchParams in the App Router
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
