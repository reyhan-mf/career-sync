"use client";

import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { updateProdiAssessmentMode } from "@/lib/supabase/admin-queries";
import type { AssessmentMode } from "@/lib/supabase/superadmin-queries";
import { useAdminData } from "../AdminDataProvider";
import Link from "next/link";
import { useMemo, useState } from "react";

interface ModeOption {
  value: AssessmentMode;
  icon: string;
  title: string;
  summary: string;
  detail: string;
}

const modeOptions: ModeOption[] = [
  {
    value: "clo",
    icon: "checklist",
    title: "Nilai per CLO",
    summary: "Setiap CLO punya nilainya sendiri",
    detail:
      "Dipakai prodi yang mencatat capaian mahasiswa per Capaian Pembelajaran Mata Kuliah. Memberi analisis paling rinci: sistem bisa menunjuk CLO spesifik yang lemah.",
  },
  {
    value: "course",
    icon: "menu_book",
    title: "Nilai per Mata Kuliah",
    summary: "Satu nilai akhir per mata kuliah",
    detail:
      "Dipakai prodi yang hanya menyimpan nilai akhir mata kuliah. Pencocokan tetap berjalan penuh — hanya rinciannya sebatas mata kuliah, bukan CLO.",
  },
];

export default function AdminSettingsPage() {
  const {
    adminCtx,
    matkul,
    clos,
    students,
    studentClos,
    studentMatkul,
    error,
    setAssessmentMode,
  } = useAdminData();

  const [saving, setSaving] = useState<AssessmentMode | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mode = adminCtx?.assessment_mode ?? "clo";

  // Matkul with no CLO at all. These are dead weight for matching in BOTH
  // modes — similarity always comes from CLO text — so it is worth surfacing
  // here where an admin might otherwise assume 'course' mode makes CLOs optional.
  const matkulTanpaClo = useMemo(() => {
    const withClo = new Set(clos.map((c) => c.matkul_id));
    return matkul.filter((m) => !withClo.has(m.id));
  }, [matkul, clos]);

  const handleSelect = async (next: AssessmentMode) => {
    if (!adminCtx || next === mode || saving) return;
    setSaving(next);
    setSaveError(null);
    setSaved(false);
    try {
      await updateProdiAssessmentMode(adminCtx.prodi_id, next);
      setAssessmentMode(next);
      setSaved(true);
    } catch (e) {
      setSaveError(`Gagal menyimpan mode penilaian: ${(e as Error).message}`);
    } finally {
      setSaving(null);
    }
  };

  // Without adminCtx there is no prodi to write to, so every control on this
  // page is inert. Show the skeleton until it arrives rather than a page of
  // silently-disabled buttons — `loading` alone is false on the first render,
  // before the shared admin store has resolved the prodi.
  if (!adminCtx && !error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed rounded-full font-label text-xs font-semibold text-primary">
          <Icon name="settings" size={14} filled />
          Pengaturan Prodi
        </div>
        <h1 className="font-headline text-3xl font-bold text-on-background">
          Mode Penilaian
        </h1>
        <p className="font-body text-on-surface-variant max-w-2xl">
          Tentukan di level mana prodi{" "}
          <span className="font-semibold text-on-surface">
            {adminCtx?.prodi_name ?? "ini"}
          </span>{" "}
          mencatat nilai mahasiswa. Pilihan ini menentukan bentuk halaman{" "}
          <Link href="/admin/grades" className="text-primary font-semibold hover:underline">
            Manajemen Nilai
          </Link>{" "}
          dan dasar perhitungan skor kecocokan lowongan.
        </p>
      </div>

      {(error || saveError) && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
          {saveError ?? error}
        </div>
      )}

      {/* The point that decides everything below: CLO text is the matching
          engine in both modes; only the grade source differs. */}
      <div className="bg-primary-fixed/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Icon name="info" className="text-primary mt-0.5 shrink-0" size={18} />
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface">
              CLO tetap wajib diisi pada kedua mode.
            </span>{" "}
            Kemiripan antara kualifikasi lowongan dan kompetensi mahasiswa selalu
            dihitung dari teks CLO. Yang dibedakan oleh pengaturan ini hanyalah{" "}
            <span className="font-semibold text-on-surface">sumber angka nilainya</span> —
            diambil dari nilai tiap CLO, atau dari nilai akhir mata kuliah.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modeOptions.map((opt) => {
          const active = mode === opt.value;
          const isSaving = saving === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={!!saving || !adminCtx}
              aria-pressed={active}
              className={`text-left rounded-2xl p-5 shadow-ambient ghost-border transition-colors disabled:opacity-60 ${
                active
                  ? "bg-primary-fixed ring-2 ring-primary"
                  : "bg-surface-container-lowest hover:bg-surface-container-high"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? "bg-primary text-on-primary" : "bg-surface-container text-primary"
                  }`}
                >
                  <Icon name={opt.icon} filled={active} />
                </div>
                {active ? (
                  <span className="inline-flex items-center gap-1 font-label text-xs font-bold text-primary">
                    <Icon name="check_circle" size={15} filled /> Aktif
                  </span>
                ) : isSaving ? (
                  <span className="font-label text-xs text-on-surface-variant">
                    Menyimpan…
                  </span>
                ) : null}
              </div>
              <h2 className="font-headline text-lg font-bold text-on-background mt-3">
                {opt.title}
              </h2>
              <p className="font-label text-xs text-primary font-semibold mt-0.5">
                {opt.summary}
              </p>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed mt-2">
                {opt.detail}
              </p>
            </button>
          );
        })}
      </div>

      {saved && (
        <div className="px-4 py-3 bg-green-50 rounded-xl text-green-700 font-label text-sm inline-flex items-center gap-2">
          <Icon name="check_circle" size={16} filled />
          Mode penilaian tersimpan. Halaman Manajemen Nilai kini mengikuti mode{" "}
          {mode === "clo" ? "per CLO" : "per mata kuliah"}.
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <h2 className="font-headline text-lg font-bold text-on-background mb-4">
          Kesiapan Data
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DataStat label="Mata Kuliah" value={matkul.length} />
          <DataStat label="CLO Kurikulum" value={clos.length} />
          <DataStat label="Mahasiswa" value={students.length} />
          <DataStat
            label={mode === "clo" ? "Nilai CLO Terisi" : "Nilai MK Terisi"}
            value={mode === "clo" ? studentClos.length : studentMatkul.length}
            tone="primary"
          />
        </div>

        {matkulTanpaClo.length > 0 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
            <Icon name="warning" size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <p className="font-body text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">
                {matkulTanpaClo.length} mata kuliah belum punya CLO
              </span>{" "}
              ({matkulTanpaClo.slice(0, 3).map((m) => m.nama).join(", ")}
              {matkulTanpaClo.length > 3 ? `, +${matkulTanpaClo.length - 3} lagi` : ""}).
              Mata kuliah tanpa CLO tidak pernah cocok dengan kualifikasi lowongan,
              termasuk di mode per mata kuliah.{" "}
              <Link href="/admin/clo" className="font-semibold underline">
                Lengkapi di Manajemen CLO
              </Link>
              .
            </p>
          </div>
        )}

        {mode === "course" && studentMatkul.length === 0 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3">
            <Icon name="lightbulb" size={16} className="text-blue-700 mt-0.5 shrink-0" />
            <p className="font-body text-xs text-blue-800 leading-relaxed">
              Belum ada nilai akhir mata kuliah yang diinput. Sementara itu sistem
              memakai rata-rata nilai CLO sebagai nilai mata kuliah, sehingga skor
              tetap muncul.{" "}
              <Link href="/admin/grades" className="font-semibold underline">
                Input nilai mata kuliah
              </Link>{" "}
              untuk memakai angka resmi prodi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DataStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary";
}) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      <p className="font-label text-xs text-on-surface-variant">{label}</p>
      <p
        className={`font-headline text-2xl font-bold mt-1 ${
          tone === "primary" ? "text-primary" : "text-on-background"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
