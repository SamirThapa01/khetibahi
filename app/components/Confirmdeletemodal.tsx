"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * ConfirmDeleteModal
 *
 * `description` accepts plain text OR JSX, so you can highlight
 * specific words inside the message, e.g.:
 *
 * description={
 *   <>This will permanently delete the sale of{" "}
 *   <span className="font-semibold text-negative">{crop}</span> to {buyer}.
 *   This action cannot be undone.</>
 * }
 */
export default function ConfirmDeleteModal({
  isOpen,
  title = "Delete item?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    cancelButtonRef.current?.focus();

    // Prevent background scroll while modal is open (nice on mobile)
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal panel — full-width sheet on mobile, centered card on larger screens */}
      <div
        className="
          relative w-full sm:max-w-sm
          rounded-t-2xl sm:rounded-xl
          bg-white p-5 sm:p-6
          shadow-xl transition-all
          pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6
        "
      >
        {/* Drag handle, mobile-only visual affordance */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />

        <h2
          id="confirm-modal-title"
          className="text-base sm:text-lg font-semibold text-gray-900"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-description"
          className="mt-2 text-sm text-gray-500"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2.5 sm:py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}