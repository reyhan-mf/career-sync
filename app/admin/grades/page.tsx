"use client";

import Icon from "@/components/ui/Icon";
import { TableRowsSkeleton } from "@/components/ui/Skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Matkul } from "@/lib/supabase/admin-queries";
import { useAdminData } from "../AdminDataProvider";
import Link from "next/link";
import { useMemo, useState } from "react";

const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];

type CoverageKey = "lengkap" | "sebagian" | "belum" | "no-clo";

interface MKCoverage {
  mk: Matkul;
  cloCount: number;
  /** Students whose CLOs are ALL graded — a partially graded student is not counted. */
  graded: number;
  /** Students with some, but not all, CLOs graded. */
  partial: number;
  progress: number;
  key: CoverageKey;
}

export default function AdminGradesPage() {
  const { adminCtx, matkul: matkuls, clos, studentClos, students, loading, error } = useAdminData();
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");

  const studentsCount = students.length;

  const coverages = useMemo<MKCoverage[]>(() => {
    return matkuls.map((mk) => {
      const mkCloIds = new Set(clos.filter((c) => c.matkul_id === mk.id).map((c) => c.id));
      const cloCount = mkCloIds.size;
      if (cloCount === 0) {
        return { mk, cloCount: 0, graded: 0, partial: 0, progress: 0, key: "no-clo" as CoverageKey };
      }
      // A student counts as covered only once EVERY CLO of the matkul is graded.
      // Counting distinct student_ids instead would mark a student done off a
      // single CLO and report coverage as complete while grades are missing.
      const gradedCloCount = new Map<string, number>();
      studentClos.forEach((sc) => {
        if (!mkCloIds.has(sc.clo_id)) return;
        gradedCloCount.set(sc.student_id, (gradedCloCount.get(sc.student_id) ?? 0) + 1);
      });
      let graded = 0;
      let partial = 0;
      gradedCloCount.forEach((n) => {
        if (n >= cloCount) graded += 1;
        else if (n > 0) partial += 1;
      });
      const progress = studentsCount > 0 ? Math.round((graded / studentsCount) * 100) : 0;
      let key: CoverageKey = "belum";
      if (studentsCount > 0 && graded === studentsCount) key = "lengkap";
      else if (graded > 0 || partial > 0) key = "sebagian";
      return { mk, cloCount, graded, partial, progress, key };
    });
  }, [matkuls, clos, studentClos, studentsCount]);

  const filteredCoverages = coverages.filter(({ mk, key }) => {
    const matchSearch =
      mk.nama.toLowerCase().includes(search.toLowerCase()) ||
      mk.kode.toLowerCase().includes(search.toLowerCase());
    const matchSemester =
      semesterFilter === "all" || String(mk.semester) === semesterFilter;
    const matchCoverage = coverageFilter === "all" || key === coverageFilter;
    return matchSearch && matchSemester && matchCoverage;
  });

  const hasActiveFilter = semesterFilter !== "all" || coverageFilter !== "all" || search !== "";

  const resetFilters = () => {
    setSearch("");
    setSemesterFilter("all");
    setCoverageFilter("all");
  };

  const lengkapCount = coverages.filter((c) => c.key === "lengkap").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Penilaian CLO Mahasiswa
          </h1>
          <p className="font-body text-on-surface-variant">
            {adminCtx
              ? `Input hasil asesmen mahasiswa Prodi ${adminCtx.prodi_name} per CLO mata kuliah.`
              : "Input hasil asesmen mahasiswa untuk setiap CLO per mata kuliah."}
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">Total Mata Kuliah</p>
          <p className="font-headline text-2xl font-bold text-on-background">{coverages.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">Nilai Lengkap</p>
          <p className="font-headline text-2xl font-bold text-green-700">{lengkapCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">Total Mahasiswa</p>
          <p className="font-headline text-2xl font-bold text-primary">{studentsCount}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari mata kuliah berdasarkan kode atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="h-12 lg:min-w-40 w-auto [&>span]:line-clamp-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {semesterOptions.map((s) => (
                <SelectItem key={s} value={s}>Semester {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={coverageFilter} onValueChange={setCoverageFilter}>
            <SelectTrigger className="h-12 lg:min-w-44 w-auto [&>span]:line-clamp-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Coverage</SelectItem>
              <SelectItem value="lengkap">Lengkap (100%)</SelectItem>
              <SelectItem value="sebagian">Sebagian</SelectItem>
              <SelectItem value="belum">Belum Dinilai</SelectItem>
              <SelectItem value="no-clo">Belum Ada CLO</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="h-12 px-4 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="filter_alt_off" size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low">
                {["Kode", "Nama Mata Kuliah", "SKS", "Semester", "Jumlah CLO", "Coverage Nilai", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton rows={6} cols={7} />
              ) : filteredCoverages.map(({ mk, cloCount, graded, partial, progress, key }) => {
                const hasCLO = cloCount > 0;
                const isComplete = key === "lengkap";
                return (
                  <tr
                    key={mk.id}
                    className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                  >
                    <td className="px-6 py-4">
                      <span className="font-label text-xs font-bold text-primary px-2 py-1 bg-primary-fixed rounded">
                        {mk.kode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0">
                          <Icon name="grade" className="text-primary" size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-medium text-on-background">{mk.nama}</p>
                          <p className="font-label text-xs text-on-surface-variant line-clamp-1">
                            {mk.deskripsi || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">
                      {mk.sks} SKS
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">
                      {mk.semester ? `Semester ${mk.semester}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {hasCLO ? (
                        <span className="inline-flex items-center gap-1 font-label text-xs font-semibold text-green-700">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          {cloCount} CLO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-label text-xs font-semibold text-error">
                          <Icon name="info" size={14} />
                          Belum ada CLO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-48">
                      {hasCLO ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center gap-3">
                            <span className="font-label text-xs text-on-surface-variant whitespace-nowrap">
                              {graded}/{studentsCount} Mhs
                            </span>
                            <span className={`font-label text-xs font-bold ${isComplete ? "text-green-700" : "text-on-background"}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 max-w-full ${isComplete ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {partial > 0 && (
                            <span className="font-label text-[10px] text-on-surface-variant">
                              {partial} mhs belum lengkap {cloCount} CLO
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-label text-xs text-on-surface-variant italic">
                          Set CLO terlebih dahulu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasCLO ? (
                        <Link
                          href={`/admin/grades/${mk.kode.toLowerCase()}`}
                          className="px-3 py-1.5 font-label text-xs font-bold text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Kelola Nilai
                          <Icon name="arrow_forward" size={14} />
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/clo/${mk.kode.toLowerCase()}`}
                          className="px-3 py-1.5 font-label text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Atur CLO
                          <Icon name="arrow_forward" size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredCoverages.length === 0 && (
                <tr className="border-t border-surface-variant">
                  <td colSpan={7} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                    {coverages.length === 0 ? "Belum ada mata kuliah." : "Tidak ada yang cocok dengan filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
