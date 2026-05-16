"use client";

import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminProfile,
  initialCLOs,
  initialGrades,
  initialMahasiswa,
  initialMataKuliah,
} from "@/lib/admin-mock";
import Link from "next/link";
import { useState } from "react";

const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];

type CoverageKey = "lengkap" | "sebagian" | "belum" | "no-clo";

export default function AdminGradesPage() {
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");

  const studentsCount = initialMahasiswa.length;

  const coverageFor = (
    mkNama: string,
  ): {
    key: CoverageKey;
    graded: number;
    progress: number;
    cloCount: number;
  } => {
    const cloCount = initialCLOs.filter((c) => c.mataKuliah === mkNama).length;
    if (cloCount === 0)
      return { key: "no-clo", graded: 0, progress: 0, cloCount: 0 };
    const mkGrades = initialGrades.filter((g) => g.mataKuliah === mkNama);
    const graded = new Set(mkGrades.map((g) => g.nim)).size;
    const progress =
      studentsCount > 0 ? Math.round((graded / studentsCount) * 100) : 0;
    let key: CoverageKey = "belum";
    if (progress === 100) key = "lengkap";
    else if (progress > 0) key = "sebagian";
    return { key, graded, progress, cloCount };
  };

  const filteredMK = initialMataKuliah.filter((mk) => {
    const matchSearch =
      mk.nama.toLowerCase().includes(search.toLowerCase()) ||
      mk.kode.toLowerCase().includes(search.toLowerCase());
    const matchSemester =
      semesterFilter === "all" || String(mk.semester) === semesterFilter;
    const matchCoverage =
      coverageFilter === "all" || coverageFor(mk.nama).key === coverageFilter;
    return matchSearch && matchSemester && matchCoverage;
  });

  const hasActiveFilter =
    semesterFilter !== "all" || coverageFilter !== "all" || search !== "";

  const resetFilters = () => {
    setSearch("");
    setSemesterFilter("all");
    setCoverageFilter("all");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Penilaian CLO Mahasiswa
          </h1>
          <p className="font-body text-on-surface-variant">
            Input hasil asesmen mahasiswa untuk setiap CLO per mata kuliah
            (Prodi {adminProfile.prodi}).
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">
            Total Mata Kuliah
          </p>
          <p className="font-headline text-2xl font-bold text-on-background">
            {initialMataKuliah.length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">
            Nilai Lengkap
          </p>
          <p className="font-headline text-2xl font-bold text-green-700">
            {
              initialMataKuliah.filter(
                (mk) => coverageFor(mk.nama).key === "lengkap",
              ).length
            }
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
          <p className="font-label text-sm text-on-surface-variant">
            Total Mahasiswa
          </p>
          <p className="font-headline text-2xl font-bold text-primary">
            {studentsCount}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
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
                <SelectItem key={s} value={s}>
                  Semester {s}
                </SelectItem>
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
              title="Reset filter"
            >
              <Icon name="filter_alt_off" size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low">
                {[
                  "Kode",
                  "Nama Mata Kuliah",
                  "SKS",
                  "Semester",
                  "Jumlah CLO",
                  "Coverage Nilai",
                  "Aksi",
                ].map((h) => (
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
              {filteredMK.map((mk) => {
                const mkCLOs = initialCLOs.filter(
                  (c) => c.mataKuliah === mk.nama,
                );
                const hasCLO = mkCLOs.length > 0;

                const mkGrades = initialGrades.filter(
                  (g) => g.mataKuliah === mk.nama,
                );
                const gradedStudents = new Set(mkGrades.map((g) => g.nim)).size;

                const progress =
                  studentsCount > 0
                    ? Math.round((gradedStudents / studentsCount) * 100)
                    : 0;
                const isComplete = progress === 100;

                return (
                  <tr
                    key={mk.kode}
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
                          <Icon
                            name="grade"
                            className="text-primary"
                            size={16}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-medium text-on-background">
                            {mk.nama}
                          </p>
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
                      Semester {mk.semester}
                    </td>
                    <td className="px-6 py-4">
                      {hasCLO ? (
                        <span className="inline-flex items-center gap-1 font-label text-xs font-semibold text-green-700">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          {mkCLOs.length} CLO
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
                              {gradedStudents}/{studentsCount} Mhs
                            </span>
                            <span
                              className={`font-label text-xs font-bold ${isComplete ? "text-green-700" : "text-on-background"}`}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 max-w-full ${isComplete ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
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
              {filteredMK.length === 0 && (
                <tr className="border-t border-surface-variant">
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                  >
                    Tidak ada mata kuliah yang cocok dengan filter.
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
