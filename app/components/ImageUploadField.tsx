"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – ImageUploadField
//  A drop-in "attach a bill/receipt photo" control.
//  Lets the farmer snap a photo (camera on mobile)
//  or pick one from their gallery, shows a preview,
//  and lets them remove it. Stores the result as a
//  compressed base64 data URL via imageUpload.ts.
// ─────────────────────────────────────────────

import { useRef, useState } from "react";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import { fileToCompressedDataUrl } from "@/app/utils/imageUpload";

interface ImageUploadFieldProps {
  label?: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export default function ImageUploadField({
  label = "Bill / receipt photo",
  value,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be re-selected later (e.g. after removing it)
    e.target.value = "";
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1">
        {label} <span className="text-ink-faint">(optional)</span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-24 w-24 rounded-xl object-cover border border-line"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove photo"
            className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-negative text-white shadow-sm hover:opacity-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-line text-ink-muted text-sm hover:border-ink-faint hover:bg-surface-2 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {loading ? "Processing…" : "Attach photo"}
          <ImageIcon className="w-3.5 h-3.5 text-ink-faint" />
        </button>
      )}

      {error && <p className="text-negative text-xs mt-1.5">{error}</p>}
    </div>
  );
}
