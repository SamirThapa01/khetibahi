"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – AvatarUpload
//  Circular profile photo with a camera badge.
//  Click anywhere on it to pick a new photo.
// ─────────────────────────────────────────────

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { fileToCompressedDataUrl } from "@/app/utils/imageUpload";

interface AvatarUploadProps {
  value?: string;
  initials: string;
  onChange: (dataUrl: string) => void;
  size?: number;
}

export default function AvatarUpload({ value, initials, onChange, size = 96 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      // Profile photos can be a bit smaller than bill photos — they're
      // only ever shown at avatar size.
      const dataUrl = await fileToCompressedDataUrl(file, { maxDimension: 512, quality: 0.82 });
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative rounded-full overflow-hidden flex-shrink-0 group"
        style={{ width: size, height: size }}
        aria-label="Change profile photo"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-brand text-white font-display font-bold text-2xl">
            {initials}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {loading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <span className="text-xs text-ink-faint">Tap photo to change</span>
      {error && <p className="text-negative text-xs">{error}</p>}
    </div>
  );
}
