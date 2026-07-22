"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – Profile Page
//
//  Doubles as the account + settings hub. Besides
//  the name/photo form, it now also carries what
//  used to live behind the mobile gear icon: quick
//  links to Udhaar, Budgets, and Recurring, plus a
//  few at-a-glance stats and the logout action —
//  the only place mobile users can log out from,
//  since the desktop Sidebar (which has its own
//  logout button) is hidden on small screens.
// ─────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import {
  Save, CheckCircle2, HandCoins, PiggyBank, Repeat, ChevronRight,
  LogOut, TrendingUp, TrendingDown, Receipt, Sprout,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useIncome } from "@/app/hooks/useIncome";
import { useExpenses } from "@/app/hooks/useExpenses";
import { useLoans } from "@/app/hooks/useLoans";
import AvatarUpload from "@/app/components/AvatarUpload";
import { ProfileSkeleton } from "@/app/components/Skeleton";
import { formatNPR } from "@/app/utils/helpers";

// Routes that don't fit the mobile bottom tab bar — reachable here
// instead. Desktop users already have every route in the Sidebar, so
// this section is mainly a mobile convenience, but it's harmless
// (and handy) to show on desktop too.
const QUICK_LINKS = [
  { href: "/loans",     label: "Udhaar",             desc: "Loans & credit you owe or are owed",  Icon: HandCoins },
  { href: "/budgets",   label: "Budgets",            desc: "Monthly spending limits by category",  Icon: PiggyBank },
  { href: "/recurring", label: "Recurring Expenses",  desc: "Bills and costs that repeat on a schedule", Icon: Repeat },
];

export default function ProfilePage() {
  const { user, updateProfile, isLoading, logout } = useAuth();
  const { income, totalIncome, isLoaded: incomeLoaded } = useIncome();
  const { totalSpend, isLoaded: expensesLoaded } = useExpenses();
  const { totalDue: loansDue, isLoaded: loansLoaded } = useLoans();

  const [name, setName] = useState(user?.name ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return <div className="text-center text-ink-faint py-20">Please log in to view your profile.</div>;
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const statsReady = incomeLoaded && expensesLoaded && loansLoaded;
  const net = totalIncome - totalSpend;
  const cropsTracked = new Set(income.map((i) => i.crop)).size;

  async function handlePhotoChange(dataUrl: string) {
    setProfileImage(dataUrl);
    setSaved(false);
    // Save the photo immediately — a change like this shouldn't need a
    // separate "Save" click, and it lets the sidebar/topbar avatar update
    // right away.
    const result = await updateProfile({ profileImage: dataUrl });
    if (!result.ok) setError(result.error ?? "Could not save photo.");
    else {
      setError(null);
      setSaved(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateProfile({ name: name.trim() });
    setSaving(false);
    if (!result.ok) setError(result.error ?? "Could not save changes.");
    else setSaved(true);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Profile</h1>
        <p className="text-sm text-ink-muted mt-0.5">Your account, your farm&apos;s numbers, and quick access to everything else.</p>
      </div>

      {/* Hero identity card */}
      <div className="bahi-ledger relative overflow-hidden bg-surface rounded-2xl border border-line shadow-soft p-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <AvatarUpload
            value={profileImage}
            initials={initials || "?"}
            onChange={handlePhotoChange}
            size={88}
          />
          <div className="min-w-0">
            <h2 className="text-xl font-display font-bold text-ink truncate">{user.name}</h2>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold">
              <Sprout className="w-3.5 h-3.5" />
              Farm Owner
            </span>
          </div>
        </div>
      </div>

      {/* At-a-glance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Net position"
          value={statsReady ? formatNPR(net) : "…"}
          Icon={net >= 0 ? TrendingUp : TrendingDown}
          tone={net >= 0 ? "brand" : "negative"}
        />
        <StatCard
          label="Income logged"
          value={statsReady ? String(income.length) : "…"}
          Icon={Receipt}
          tone="accent"
        />
        <StatCard
          label="Crops tracked"
          value={statsReady ? String(cropsTracked) : "…"}
          Icon={Sprout}
          tone="brand"
        />
        <StatCard
          label="Udhaar outstanding"
          value={statsReady ? formatNPR(loansDue) : "…"}
          Icon={HandCoins}
          tone={loansDue > 0 ? "negative" : "brand"}
        />
      </div>

      {/* Quick links — moved here from the old mobile gear menu */}
      <div className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-display font-semibold text-ink">Quick links</h3>
        </div>
        <div className="divide-y divide-line">
          {QUICK_LINKS.map(({ href, label, desc, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-soft text-brand flex-shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-muted truncate">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Editable account details */}
      <div className="bg-surface rounded-2xl border border-line shadow-soft p-6 space-y-4">
        <h3 className="text-sm font-display font-semibold text-ink">Account details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface-2 text-ink-muted text-sm cursor-not-allowed"
            />
            <p className="text-xs text-ink-faint mt-1">Email can&apos;t be changed here.</p>
          </div>

          {error && <p className="text-negative text-xs">{error}</p>}
          {saved && !error && (
            <p className="flex items-center gap-1.5 text-brand text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Logout — the only place mobile users can reach this, since the
          Sidebar (which has its own logout) is desktop-only. */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-line bg-surface hover:bg-negative-soft hover:border-negative/30 hover:text-negative text-ink-muted text-sm font-semibold transition-colors disabled:opacity-60"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}

function StatCard({
  label, value, Icon, tone,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "accent" | "negative";
}) {
  const toneClasses = {
    brand:    "bg-brand-soft text-brand",
    accent:   "bg-accent-soft text-accent",
    negative: "bg-negative-soft text-negative",
  }[tone];

  return (
    <div className="bg-surface rounded-2xl border border-line p-4 shadow-soft flex items-start gap-3 min-w-0">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${toneClasses}`}>
        <Icon className="w-4.5 h-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted truncate">{label}</p>
        <p className="text-sm font-semibold text-ink truncate">{value}</p>
      </div>
    </div>
  );
}