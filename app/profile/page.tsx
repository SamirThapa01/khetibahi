"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – Profile Page
//  Lets the farmer view their account and update
//  their name + profile photo. Email/password
//  aren't editable here — that's a separate,
//  more sensitive flow.
// ─────────────────────────────────────────────

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import AvatarUpload from "@/app/components/AvatarUpload";
import { ProfileSkeleton } from "@/app/components/Skeleton";

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Profile</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage your account details.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-line shadow-soft p-6 space-y-6">
        {/* Photo */}
        <div className="flex justify-center">
          <AvatarUpload
            value={profileImage}
            initials={initials || "?"}
            onChange={handlePhotoChange}
            size={96}
          />
        </div>

        {/* Details form */}
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
    </div>
  );
}
