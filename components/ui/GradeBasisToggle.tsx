"use client";

import Icon from "@/components/ui/Icon";

// Segmented control for choosing which grade weights the match score.
//
// Shared by the student job-matching screen and both HR talent-pool screens so
// the control looks and behaves identically everywhere. The student side has
// two options (CLO / mata kuliah); HR has a third ("Sesuai Prodi") that keeps
// every candidate on their own prodi's basis.

export interface GradeBasisOption<T extends string> {
  value: T;
  label: string;
  icon: string;
}

/** The two bases a student can view their own scores on. */
export const STUDENT_BASIS_OPTIONS: GradeBasisOption<"clo" | "course">[] = [
  { value: "clo", label: "Nilai per CLO", icon: "checklist" },
  { value: "course", label: "Nilai Mata Kuliah", icon: "menu_book" },
];

/**
 * What HR can rank a talent pool by. "Sesuai Prodi" keeps every candidate on
 * their own prodi's basis — the only option that is always valid for a pool
 * mixing prodi that grade per CLO with prodi that grade per mata kuliah.
 */
export const HR_BASIS_OPTIONS: GradeBasisOption<"auto" | "clo" | "course">[] = [
  { value: "auto", label: "Sesuai Prodi", icon: "auto_awesome" },
  ...STUDENT_BASIS_OPTIONS,
];

interface GradeBasisToggleProps<T extends string> {
  value: T;
  options: GradeBasisOption<T>[];
  onChange: (value: T) => void;
  /** Shown to the left of the buttons; omit for a bare control. */
  label?: string;
  disabled?: boolean;
}

export default function GradeBasisToggle<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled = false,
}: GradeBasisToggleProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="font-label text-xs text-on-surface-variant">{label}</span>
      )}
      <div
        role="group"
        aria-label="Basis nilai"
        className="flex rounded-xl bg-surface-container-low p-1"
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label text-xs font-semibold transition-colors disabled:opacity-60 ${
                active
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name={opt.icon} size={14} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
