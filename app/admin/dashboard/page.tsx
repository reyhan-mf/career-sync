"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  adminProfile,
  gradeColor,
  gradeOptions,
  initialCLOs,
  initialGrades,
  initialMahasiswa,
  initialMataKuliah,
} from "@/lib/admin-mock";

const angkatanData = [
  { angkatan: "2021", count: 38, semester: "Semester 7" },
  { angkatan: "2022", count: 42, semester: "Semester 5" },
  { angkatan: "2023", count: 29, semester: "Semester 3" },
  { angkatan: "2024", count: 16, semester: "Semester 1" },
];

interface AttentionItem {
  icon: string;
  label: string;
  count: number;
  detail: string;
  href: string;
  tone: "warning" | "info";
}

function coverageStyle(ratio: number) {
  if (ratio === 0) return { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Belum" };
  if (ratio >= 1) return { bg: "bg-green-50", text: "text-green-700", label: "Lengkap" };
  if (ratio >= 0.5) return { bg: "bg-blue-50", text: "text-blue-700", label: "Sebagian" };
  return { bg: "bg-tertiary-fixed", text: "text-on-tertiary-container", label: "Mulai" };
}

export default function AdminDashboard() {
  const stats = useMemo(() => ({
    mahasiswa: initialMahasiswa.length,
    clo: initialCLOs.length,
    mataKuliah: initialMataKuliah.length,
    nilai: initialGrades.length,
  }), []);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    const mkTanpaCLO = initialMataKuliah.filter(
      (m) => !initialCLOs.some((c) => c.mataKuliah === m.nama)
    );
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

    const mhsTanpaNilai = initialMahasiswa.filter(
      (m) => !initialGrades.some((g) => g.nim === m.nim)
    );
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

    const mkSebagian = initialMataKuliah
      .map((m) => {
        const cloCount = initialCLOs.filter((c) => c.mataKuliah === m.nama).length;
        if (cloCount === 0) return null;
        const dinilaiNims = new Set(
          initialGrades.filter((g) => g.mataKuliah === m.nama).map((g) => g.nim)
        );
        const total = initialMahasiswa.length;
        const ratio = total ? dinilaiNims.size / total : 0;
        if (ratio === 0 || ratio >= 1) return null;
        return { ...m, dinilai: dinilaiNims.size, total, ratio };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    if (mkSebagian.length > 0) {
      items.push({
        icon: "pending_actions",
        label: "Penilaian belum lengkap di beberapa mata kuliah",
        count: mkSebagian.length,
        detail: mkSebagian.slice(0, 3).map((m) => `${m.nama} (${m.dinilai}/${m.total})`).join(", "),
        href: "/admin/grades",
        tone: "info",
      });
    }

    const mhsNonaktif = initialMahasiswa.filter((m) => m.status === "inactive");
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
  }, []);

  const gradingInsight = useMemo(() => {
    const counts: Record<string, number> = {};
    gradeOptions.forEach((g) => (counts[g] = 0));
    initialGrades.forEach((g) => {
      counts[g.grade] = (counts[g.grade] ?? 0) + 1;
    });
    const total = initialGrades.length;
    const avg = total ? initialGrades.reduce((s, g) => s + g.score, 0) / total : 0;
    const high = initialGrades.filter((g) => g.score >= 85).length;
    const low = initialGrades.filter((g) => g.score < 70).length;
    return {
      counts,
      total,
      avg: Math.round(avg * 10) / 10,
      highPct: total ? Math.round((high / total) * 100) : 0,
      lowPct: total ? Math.round((low / total) * 100) : 0,
    };
  }, []);

  const mkCoverage = useMemo(() => {
    return initialMataKuliah.map((m) => {
      const clos = initialCLOs.filter((c) => c.mataKuliah === m.nama);
      const dinilaiNims = new Set(
        initialGrades.filter((g) => g.mataKuliah === m.nama).map((g) => g.nim)
      );
      const ratio = initialMahasiswa.length ? dinilaiNims.size / initialMahasiswa.length : 0;
      return {
        kode: m.kode,
        nama: m.nama,
        cloCount: clos.length,
        mhsDinilai: dinilaiNims.size,
        totalMhs: initialMahasiswa.length,
        ratio,
      };
    });
  }, []);

  const [expandedMK, setExpandedMK] = useState<string | null>(null);

  const mhsStatusPerMK = useMemo(() => {
    const result = new Map<string, { nim: string; name: string; angkatan: string; dinilai: number; total: number; status: "lengkap" | "sebagian" | "belum" }[]>();
    initialMataKuliah.forEach((mk) => {
      const clos = initialCLOs.filter((c) => c.mataKuliah === mk.nama);
      const totalClo = clos.length;
      const students = initialMahasiswa.map((m) => {
        const studentGrades = initialGrades.filter((g) => g.mataKuliah === mk.nama && g.nim === m.nim);
        const dinilai = new Set(studentGrades.map((g) => g.clo)).size;
        let status: "lengkap" | "sebagian" | "belum" = "belum";
        if (totalClo > 0 && dinilai === totalClo) status = "lengkap";
        else if (dinilai > 0) status = "sebagian";
        return { nim: m.nim, name: m.name, angkatan: m.angkatan, dinilai, total: totalClo, status };
      });
      result.set(mk.kode, students);
    });
    return result;
  }, []);


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Identity Banner */}
      <div className="bg-linear-to-r from-primary to-secondary rounded-2xl p-6 shadow-ambient relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -right-4 top-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
            <span className="font-headline text-2xl font-bold text-white">{adminProfile.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-headline text-2xl font-bold text-white">{adminProfile.name}</h1>
              <span className="px-2.5 py-0.5 bg-white/25 backdrop-blur-sm rounded-full font-label text-xs font-semibold text-white border border-white/30">
                {adminProfile.role}
              </span>
            </div>
            <p className="font-body text-sm text-white/90 mb-1">{adminProfile.email}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85">
              <span className="font-label text-sm flex items-center gap-1.5">
                <Icon name="school" size={14} className="text-white/85" /> Prodi {adminProfile.prodi}
              </span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />
              <span className="font-label text-xs">{adminProfile.fakultas} — {adminProfile.university}</span>
            </div>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sebaran Mahasiswa per Angkatan */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <h2 className="font-headline text-xl font-bold text-on-background mb-6">Sebaran Mahasiswa per Angkatan</h2>
          <div className="space-y-3">
            {angkatanData.map((r) => (
              <div key={r.angkatan} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
                    <Icon name="people" className="text-primary" size={18} />
                  </div>
                  <div>
                    <p className="font-label text-sm font-bold text-on-background">Angkatan {r.angkatan}</p>
                    <p className="font-label text-xs text-on-surface-variant">{r.semester}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline text-2xl font-bold text-primary">{r.count}</p>
                  <p className="font-label text-xs text-on-surface-variant">mahasiswa</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribusi Grade */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-background">Distribusi Grade</h2>
              <p className="font-label text-xs text-on-surface-variant mt-1">Berdasarkan {gradingInsight.total} nilai terinput.</p>
            </div>
            <div className="text-right">
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Rata-rata</p>
              <p className="font-headline text-2xl font-bold text-primary leading-tight">{gradingInsight.avg || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-5">
            {gradeOptions.map((g) => {
              const count = gradingInsight.counts[g] ?? 0;
              const active = count > 0;
              return (
                <div
                  key={g}
                  className={`rounded-xl p-3 text-center transition-colors ${active ? gradeColor(g) : "bg-surface-container-low text-on-surface-variant"}`}
                >
                  <p className="font-headline text-lg font-bold leading-none">{g}</p>
                  <p className={`font-label text-xs mt-1 ${active ? "" : "opacity-60"}`}>{count} nilai</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-outline-variant/20">
            <div className="bg-green-50 rounded-xl px-3 py-2">
              <p className="font-label text-[10px] uppercase tracking-wider text-green-700">Skor ≥ 85</p>
              <p className="font-headline text-lg font-bold text-green-700">{gradingInsight.highPct}%</p>
            </div>
            <div className="bg-red-50 rounded-xl px-3 py-2">
              <p className="font-label text-[10px] uppercase tracking-wider text-red-700">Skor &lt; 70</p>
              <p className="font-headline text-lg font-bold text-red-700">{gradingInsight.lowPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Nilai per Mata Kuliah */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-background">Coverage Nilai per Mata Kuliah</h2>
              <p className="font-label text-xs text-on-surface-variant mt-1">
                Klik baris untuk melihat detail mahasiswa yang sudah dan belum dinilai.
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
              {mkCoverage.map((m) => {
                const style = coverageStyle(m.ratio);
                const isExpanded = expandedMK === m.kode;
                const students = mhsStatusPerMK.get(m.kode) ?? [];
                return (
                  <React.Fragment key={m.kode}>
                    <tr
                      onClick={() => setExpandedMK(isExpanded ? null : m.kode)}
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
                          {m.nama}
                        </span>
                      </td>
                      <td className="px-6 py-3"><span className="font-label text-xs font-bold text-primary px-2 py-0.5 bg-primary-fixed rounded">{m.kode}</span></td>
                      <td className="px-6 py-3 font-label text-sm text-on-surface-variant">{m.cloCount}</td>
                      <td className="px-6 py-3">
                        <span className="font-label text-sm font-bold text-on-background">{m.mhsDinilai}</span>
                        <span className="font-label text-xs text-on-surface-variant"> / {m.totalMhs}</span>
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
                                Detail Mahasiswa — {m.nama}
                              </p>
                              <Link
                                href={`/admin/grades/${m.kode.toLowerCase()}`}
                                className="group/link inline-flex items-center gap-1.5 font-label text-xs font-semibold text-primary hover:bg-primary-fixed rounded-lg px-2.5 py-1 transition-colors"
                              >
                                Input Nilai
                                <Icon name="arrow_forward" size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                              </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {students.map((s) => {
                                const badgeStyle = s.status === "lengkap"
                                  ? "bg-green-50 text-green-700"
                                  : s.status === "sebagian"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-surface-container text-on-surface-variant";
                                const badgeLabel = s.status === "lengkap" ? "Lengkap" : s.status === "sebagian" ? "Sebagian" : "Belum";
                                return (
                                  <div key={s.nim} className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-3.5 py-2.5 ghost-border">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.status === "lengkap" ? "bg-green-50" : s.status === "sebagian" ? "bg-blue-50" : "bg-surface-container"}`}>
                                        <Icon
                                          name={s.status === "lengkap" ? "check_circle" : s.status === "sebagian" ? "pending" : "radio_button_unchecked"}
                                          size={16}
                                          className={s.status === "lengkap" ? "text-green-700" : s.status === "sebagian" ? "text-blue-700" : "text-on-surface-variant"}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-body text-sm font-medium text-on-background truncate">{s.name}</p>
                                        <p className="font-label text-[10px] text-on-surface-variant">{s.nim} • {s.angkatan}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="font-label text-[10px] text-on-surface-variant">{s.dinilai}/{s.total}</span>
                                      <span className={`inline-flex px-2 py-0.5 rounded-full font-label text-[10px] font-semibold ${badgeStyle}`}>
                                        {badgeLabel}
                                      </span>
                                    </div>
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
      </div>
    </div>
  );
}

