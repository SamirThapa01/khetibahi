"use client";

// ─────────────────────────────────────────────
//  KhetiBahi – ImageLightbox
//  Full-screen viewer for a bill/receipt photo,
//  opened by tapping the thumbnail on a row.
// ─────────────────────────────────────────────

import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="w-5 h-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Bill photo"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full rounded-2xl shadow-lift object-contain"
      />
    </div>
  );
}
