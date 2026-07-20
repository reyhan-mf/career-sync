"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional safer alternative to the destructive action (e.g. "Tutup saja"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  secondaryLabel,
  onSecondary,
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isDanger ? "bg-error-container" : "bg-primary-fixed"
            }`}
          >
            <Icon
              name={isDanger ? "warning" : "help"}
              className={isDanger ? "text-error" : "text-primary"}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-headline text-lg font-bold text-on-background mb-1">
              {title}
            </h3>
            {description && (
              <p className="font-body text-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
        </div>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            disabled={loading}
            className="w-full mb-3 py-2.5 rounded-xl bg-primary-fixed font-label text-sm font-bold text-primary hover:bg-primary-fixed/70 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {secondaryLabel}
          </button>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-label text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              loading
                ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                : isDanger
                  ? "bg-error text-on-error hover:bg-error/90"
                  : "btn-gradient"
            }`}
          >
            {loading && (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            )}
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
