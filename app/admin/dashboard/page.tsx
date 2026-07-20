"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCardSkeleton, StatGridSkeleton } from "@/components/ui/Skeletons";
import { type Matkul } from "@/lib/supabase/admin-queries";
import { useAdminData } from "../AdminDataProvider";
import Link from "next/link";
import React, { useMemo, useState } from "react";

interface AttentionItem {
  icon: string;
  label: string;
  count: number;
  detail: string;
  href: string;
  tone: "warning" | "info";
}

interface MKCoverageDetail {
  mk: Matkul;
  cloCount: number;
  /** studentId → how many of this matkul's CLOs are graded for them. */
  gradedCloCount: Map<string, number>;
  /** Students with every CLO graded. This is what "covered" means. */
  fullyGradedIds: Set<string>;
  /** Students with at least one grade — used for "no grades at all" checks. */
  anyGradedIds: Set<string>;
  ratio: number;
}

function coverageStyle(ratio: number) {
  if (ratio === 0) return { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Belum" };
  if (ratio >= 1) return { bg: "bg-green-50", text: "text-green-700", label: "Lengkap" };
  if (ratio >= 0.5) return { bg: "bg-blue-50", text: "text-blue-700", label: "Sebagian" };
  return { bg: "bg-tertiary-fixed", text: "text-on-tertiary-container", label: "Mulai" };
}

export default function AdminDashboard() {
  const { adminCtx, students, matkul: matkuls, clos, studentClos, loading, error } = useAdminData();
  const [expandedMK, setExpandedMK] = useState<string | null>(null);

  const coverageData = useMemo<MKCoverageDetail[]>(() => {
    return matkuls.map((mk) => {
      const mkCloIds = new Set(clos.filter((c) => c.matkul_id === mk.id).map((c) => c.id));
      const cloCount = mkCloIds.size;
      if (cloCount === 0) {
        return {
          mk,
          cloCount: 0,
          gradedCloCount: new Map<string, number>(),
          fullyGradedIds: new Set<string>(),
          anyGradedIds: new Set<string>(),
          ratio: 0,
        };
      }
      // Coverage = students whose CLOs are ALL graded. A student with one CLO
      // missing is still an unfinished assessment and must not count as done.
      const gradedCloCount = new Map<string, number>();
      studentClos.forEach((sc) => {
        if (!mkCloIds.has(sc.clo_id)) return;
        gradedCloCount.set(sc.student_id, (gradedCloCount.get(sc.student_id) ?? 0) + 1);
      });
      const fullyGradedIds = new Set<string>();
      const anyGradedIds = new Set<string>();
      gradedCloCount.forEach((n, studentId) => {
        anyGradedIds.add(studentId);
        if (n >= cloCount) fullyGradedIds.add(studentId);
      });
      const ratio = students.length ? fullyGradedIds.size / students.length : 0;
      return { mk, cloCount, gradedCloCount, fullyGradedIds, anyGradedIds, ratio };
    });
  }, [matkuls, clos, studentClos, students]);

  const stats = useMemo(() => {
    return {
      mahasiswa: students.length,
      clo: clos.length,
      mataKuliah: matkuls.length,
      nilai: studentClos.length,
    };
  }, [students, clos, matkuls, studentClos]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    const mkTanpaCLO = coverageData.filter((c) => c.cloCount === 0).map((c) => c.mk);
    if (mkTanpaCLO.length > 0) {
      items.push({
        icon: "menu_book",
        label: "Mata kuliah belum memiliki CLO",
        count: mkTanpaCLO.length,
        detail: mkTanpaCLO.slice(0, 3).map((m) => m.nama).join(", ") +
          (mkTanpaCLO.length > 3 ? `, +${mkTanpaCLO.length - 3} lagi` : ""),
        href: "/admin/clo",
        tone: "warning",
      });
    }

    const gradedStudentIds = new Set<string>();
    coverageData.forEach((c) => c.anyGradedIds.forEach((id) => gradedStudentIds.add(id)));
    const mhsTanpaNilai = students.filter((s) => !gradedStudentIds.has(s.id));
    if (mhsTanpaNilai.length > 0) {
      items.push({
        icon: "grade",
        label: "Mahasiswa belum memiliki nilai apapun",
        count: mhsTanpaNilai.length,
        detail: mhsTanpaNilai.slice(0, 3).map((m) => `${m.name} (${m.nim})`).join(", "),
        href: "/admin/grades",
        tone: "info",
      });
    }

    const mkSebagian = coverageData.filter(
      (c) => c.cloCount > 0 && c.ratio < 1 && c.anyGradedIds.size > 0,
    );
    if (mkSebagian.length > 0) {
      items.push({
        icon: "pending_actions",
        label: "Penilaian belum lengkap di beberapa mata kuliah",
        count: mkSebagian.length,
        detail: mkSebagian
          .slice(0, 3)
          .map((c) => `${c.mk.nama} (${c.fullyGradedIds.size}/${students.length})`)
          .join(", "),
        href: "/admin/grades",
        tone: "info",
      });
    }

    const mhsNonaktif = students.filter((s) => s.status === "inactive");
    if (mhsNonaktif.length > 0) {
      items.push({
        icon: "person_off",
        label: "Mahasiswa dengan akun nonaktif",
        count: mhsNonaktif.length,
        detail: mhsNonaktif.slice(0, 3).map((m) => m.name).join(", "),
        href: "/admin/users",
        tone: "info",
      });
    }

    return items;
  }, [coverageData, students]);

  const { mkNeedsAttention, completedCount } = useMemo(() => {
    const needs = coverageData.filter((c) => c.ratio < 1).sort((a, b) => a.ratio - b.ratio);
    const completed = coverageData.filter((c) => c.ratio >= 1 && c.cloCount > 0).length;
    return { mkNeedsAttention: needs, completedCount: completed };
  }, [coverageData]);

  const initials = useMemo(() => {
    if (!adminCtx?.admin_name) return "?";
    const parts = adminCtx.admin_name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return adminCtx.admin_name.slice(0, 2).toUpperCase();
  }, [adminCtx]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <StatGridSkeleton />
        <ListCardSkeleton rows={3} />
        <ListCardSkeleton rows={3} />
      </div>
    );
  }

  if (error && !adminCtx) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="error" size={48} className="text-error mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Gagal memuat dashboard</h1>
        <p className="font-body text-on-surface-variant mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Identity Banner */}
      {adminCtx && (
        <div className="bg-linear-to-r from-primary to-secondary rounded-2xl p-6 shadow-ambient relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -right-4 top-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
              <span className="font-headline text-2xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-headline text-2xl font-bold text-white">{adminCtx.admin_name}</h1>
                <span className="px-2.5 py-0.5 bg-white/25 backdrop-blur-sm rounded-full font-label text-xs font-semibold text-white border border-white/30">
                  Admin Prodi
                </span>
              </div>
              {adminCtx.email && <p className="font-body text-sm text-white/90 mb-1">{adminCtx.email}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85">
                <span className="font-label text-sm flex items-center gap-1.5">
                  <Icon name="school" size={14} className="text-white/85" /> Prodi {adminCtx.prodi_name}
                </span>
                {adminCtx.fakultas && (
                  <>
                    <span className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />
                    <span className="font-label text-xs">{adminCtx.fakultas}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" label="Mahasiswa Terdaftar" value={stats.mahasiswa} />
        <StatCard icon="menu_book" label="Mata Kuliah" value={stats.mataKuliah} iconBgClass="bg-blue-50" iconTextClass="text-blue-700" />
        <StatCard icon="school" label="Total CLO" value={stats.clo} iconBgClass="bg-green-50" iconTextClass="text-green-700" />
        <StatCard icon="grade" label="Nilai Terinput" value={stats.nilai} iconBgClass="bg-tertiary-fixed" iconTextClass="text-tertiary" />
      </div>

      {/* Perlu Perhatian */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
              <Icon name="priority_high" className="text-on-tertiary-container" size={20} />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-on-background">Perlu Perhatian</h2>
              <p className="font-label text-xs text-on-surface-variant">Item yang perlu Anda tindak lanjuti.</p>
            </div>
          </div>
          {attentionItems.length > 0 && (
            <span className="font-label text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
              {attentionItems.length} item
            </span>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="check_circle" className="text-green-700" size={28} />
            </div>
            <p className="font-headline text-base font-bold text-on-background">Semua data lengkap</p>
            <p className="font-label text-xs text-on-surface-variant mt-1">Tidak ada item yang membutuhkan perhatian saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attentionItems.map((item, idx) => {
              const toneStyles = item.tone === "warning"
                ? { iconBg: "bg-tertiary-fixed", iconText: "text-on-tertiary-container", badge: "bg-tertiary text-on-tertiary" }
                : { iconBg: "bg-blue-50", iconText: "text-blue-700", badge: "bg-blue-100 text-blue-700" };
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                >
                  <div className={`w-10 h-10 ${toneStyles.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon name={item.icon} className={toneStyles.iconText} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-body text-sm font-semibold text-on-background">{item.label}</p>
                      <span className={`font-label text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${toneStyles.badge}`}>
                        {item.count}
                      </span>
                    </div>
                    <p className="font-label text-xs text-on-surface-variant truncate">{item.detail}</p>
                  </div>
                  <Icon name="chevron_right" className="text-on-surface-variant group-hover:translate-x-0.5 group-hover:text-primary transition-all shrink-0 mt-2" size={18} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Coverage Nilai per Mata Kuliah */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-background">Mata Kuliah Perlu Penilaian</h2>
              <p className="font-label text-xs text-on-surface-variant mt-1">
                Hanya menampilkan mata kuliah yang penilaiannya belum lengkap. Klik baris untuk detail.
              </p>
            </div>
            <Link
              href="/admin/grades"
              className="group hidden sm:inline-flex items-center gap-1.5 font-label text-sm font-semibold text-primary hover:bg-primary-fixed rounded-lg px-3 py-1.5 transition-colors"
            >
              Kelola Nilai
              <Icon name="arrow_forward" size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
        {mkNeedsAttention.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="check_circle" className="text-green-700" size={28} />
            </div>
            <p className="font-headline text-base font-bold text-on-background">
              {matkuls.length === 0 ? "Belum ada mata kuliah" : "Semua mata kuliah sudah dinilai lengkap"}
            </p>
            <p className="font-label text-xs text-on-surface-variant mt-1">
              {matkuls.length === 0
                ? "Tambahkan mata kuliah di halaman Manajemen CLO."
                : `${completedCount} mata kuliah memiliki nilai untuk seluruh mahasiswa.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-3 text-left w-8"></th>
                  {["Mata Kuliah", "Kode", "CLO", "Mahasiswa Dinilai", "Status"].map((h, i) => (
                    <th key={i} className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mkNeedsAttention.map((c) => {
                  const style = coverageStyle(c.ratio);
                  const isExpanded = expandedMK === c.mk.kode;
                  return (
                    <React.Fragment key={c.mk.id}>
                      <tr
                        onClick={() => setExpandedMK(isExpanded ? null : c.mk.kode)}
                        className={`group border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer ${isExpanded ? "bg-surface-container-low" : ""}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <Icon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            size={20}
                            className="text-on-surface-variant group-hover:text-primary transition-colors"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-body text-sm font-medium text-on-background group-hover:text-primary transition-colors">
                            {c.mk.nama}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-label text-xs font-bold text-primary px-2 py-0.5 bg-primary-fixed rounded">
                            {c.mk.kode}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-label text-sm text-on-surface-variant">{c.cloCount}</td>
                        <td className="px-6 py-3">
                          <span className="font-label text-sm font-bold text-on-background">{c.fullyGradedIds.size}</span>
                          <span className="font-label text-xs text-on-surface-variant"> / {students.length}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-3 py-1 rounded-full font-label text-xs font-semibold ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-outline-variant/10">
                          <td colSpan={6} className="p-0">
                            <div className="bg-surface-container-low/50 px-6 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                                  Detail Mahasiswa — {c.mk.nama}
                                </p>
                                <Link
                                  href={`/admin/grades/${c.mk.kode.toLowerCase()}`}
                                  className="group/link inline-flex items-center gap-1.5 font-label text-xs font-semibold text-primary hover:bg-primary-fixed rounded-lg px-2.5 py-1 transition-colors"
                                >
                                  Input Nilai
                                  <Icon name="arrow_forward" size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {students.map((s) => {
                                  const gradedClos = c.gradedCloCount.get(s.id) ?? 0;
                                  const status: "lengkap" | "sebagian" | "belum" =
                                    gradedClos >= c.cloCount ? "lengkap" : gradedClos > 0 ? "sebagian" : "belum";
                                  const badgeStyle =
                                    status === "lengkap" ? "bg-green-50 text-green-700"
                                    : status === "sebagian" ? "bg-blue-50 text-blue-700"
                                    : "bg-surface-container text-on-surface-variant";
                                  const badgeLabel =
                                    status === "lengkap" ? "Dinilai"
                                    : status === "sebagian" ? `${gradedClos}/${c.cloCount} CLO`
                                    : "Belum";
                                  const iconWrapStyle =
                                    status === "lengkap" ? "bg-green-50"
                                    : status === "sebagian" ? "bg-blue-50"
                                    : "bg-surface-container";
                                  const iconName =
                                    status === "lengkap" ? "check_circle"
                                    : status === "sebagian" ? "pending"
                                    : "radio_button_unchecked";
                                  const iconStyle =
                                    status === "lengkap" ? "text-green-700"
                                    : status === "sebagian" ? "text-blue-700"
                                    : "text-on-surface-variant";
                                  return (
                                    <div key={s.id} className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-3.5 py-2.5 ghost-border">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconWrapStyle}`}>
                                          <Icon name={iconName} size={16} className={iconStyle} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-body text-sm font-medium text-on-background truncate">{s.name}</p>
                                          <p className="font-label text-[10px] text-on-surface-variant">{s.nim} • {s.angkatan ?? "—"}</p>
                                        </div>
                                      </div>
                                      <span className={`inline-flex px-2 py-0.5 rounded-full font-label text-[10px] font-semibold shrink-0 ml-2 ${badgeStyle}`}>
                                        {badgeLabel}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {completedCount > 0 && mkNeedsAttention.length > 0 && (
          <div className="px-6 py-3 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between gap-3">
            <p className="font-label text-xs text-on-surface-variant flex items-center gap-2">
              <Icon name="check_circle" size={14} className="text-green-700" />
              {completedCount} mata kuliah sudah dinilai lengkap
            </p>
            <Link
              href="/admin/grades"
              className="font-label text-xs font-semibold text-primary hover:underline"
            >
              Lihat semua
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
