"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
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
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-label text-sm font-bold transition-colors ${
              isDanger
                ? "bg-error text-on-error hover:bg-error/90"
                : "btn-gradient"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
