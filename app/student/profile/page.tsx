"use client";

import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, StatGridSkeleton } from "@/components/ui/Skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChangePasswordModal from "@/components/ui/ChangePasswordModal";
import React, { useMemo, useState } from "react";
import { useStudentData } from "../StudentDataProvider";
import type { CourseRecord } from "@/lib/supabase/student-queries";

function gradeColor(grade: number | null) {
  if (grade == null) return "text-on-surface-variant bg-surface-container";
  if (grade >= 85) return "text-green-700 bg-green-50";
  if (grade >= 70) return "text-blue-700 bg-blue-50";
  if (grade >= 55) return "text-tertiary bg-tertiary-fixed";
  return "text-error bg-error-container";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "?";
}

interface CourseWithStats extends CourseRecord {
  gradedCount: number;
  totalClos: number;
  avgScore: number | null;
}

export default function ProfilePage() {
  const { profile, transcript, loading, error } = useStudentData();
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [filterSemester, setFilterSemester] = useState("all");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const courses = useMemo<CourseWithStats[]>(() => {
    return transcript.map((course) => {
      const scores = course.clos
        .map((c) => c.grade)
        .filter((g): g is number => typeof g === "number");
      // A prodi that grades per mata kuliah has no CLO grades at all, so the
      // CLO average would read "Belum dinilai" for a fully-graded transcript.
      // The directly-entered final grade wins; otherwise keep the exact CLO
      // average (unrounded) that this page has always shown.
      const avgScore =
        course.courseGradeSource === "direct"
          ? course.courseGrade
          : scores.length
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null;
      return {
        ...course,
        gradedCount: scores.length,
        totalClos: course.clos.length,
        avgScore,
      };
    });
  }, [transcript]);

  const totalCLOs = courses.reduce((acc, c) => acc + c.totalClos, 0);
  const totalSKS = courses.reduce((acc, c) => acc + (c.matkul.sks ?? 0), 0);
  // Flat average over every CLO grade — unchanged for prodi that grade per CLO.
  // Only when there is no CLO grade at all (prodi grading per mata kuliah) do we
  // fall back to averaging the per-matkul final grades.
  const cloScores = courses
    .flatMap((c) => c.clos.map((cl) => cl.grade))
    .filter((g): g is number => typeof g === "number");
  const allScores = cloScores.length
    ? cloScores
    : courses.map((c) => c.avgScore).filter((g): g is number => typeof g === "number");
  const ipk = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";

  const semesters = useMemo(
    () => [...new Set(courses.map((c) => c.matkul.semester).filter((s): s is number => s != null))].sort(),
    [courses],
  );
  const filteredCourses = filterSemester === "all"
    ? courses
    : courses.filter((c) => String(c.matkul.semester) === filterSemester);

  if (loading && !profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-3">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <StatGridSkeleton count={3} />
        <CardSkeleton lines={6} />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="error" size={48} className="text-error mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Gagal memuat profil</h1>
        <p className="font-body text-on-surface-variant">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="person_off" size={48} className="text-on-surface-variant mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
          Profil tidak tersedia
        </h1>
        <p className="font-body text-on-surface-variant">
          Akun Anda belum ditautkan ke data mahasiswa.
        </p>
      </div>
    );
  }

  const { student, prodi } = profile;

  return (
    <>
      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold text-on-background">Profil Mahasiswa</h1>
          <p className="font-body text-on-surface-variant">
            Informasi mahasiswa, data akademik, dan capaian pembelajaran per mata kuliah.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
        )}

        {/* Student Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border p-6 relative">
          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="lock_reset" size={16} />
            Ganti Password
          </button>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="shrink-0 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="font-headline text-3xl font-bold text-on-primary">
                {getInitials(student.name)}
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              <Field label="Nama Lengkap" value={student.name} />
              <Field label="NIM" value={student.nim} />
              <Field label="Program Studi" value={prodi?.name ?? "—"} />
              <Field label="Fakultas" value={prodi?.fakultas ?? "—"} />
              <Field label="Angkatan" value={student.angkatan != null ? String(student.angkatan) : "—"} />
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-xs font-bold ${
                    student.status === "active"
                      ? "text-green-700 bg-green-50"
                      : "text-on-surface-variant bg-surface-container"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      student.status === "active" ? "bg-green-600" : "bg-outline"
                    }`}
                  />
                  {student.status === "active" ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <Field label="Email" value={student.email ?? "—"} />
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">IPK</p>
                <p className="font-headline text-xl font-bold text-primary">{ipk}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <SummaryCard icon="menu_book" iconBg="bg-primary-fixed" iconText="text-primary" label="Mata Kuliah" value={courses.length} />
          <SummaryCard icon="school" iconBg="bg-green-50" iconText="text-green-700" label="Total CLO" value={totalCLOs} />
          <SummaryCard icon="trending_up" iconBg="bg-blue-50" iconText="text-blue-700" label="Rata-rata Nilai" value={ipk} />
          <SummaryCard icon="emoji_events" iconBg="bg-tertiary-fixed" iconText="text-tertiary" label="Total SKS" value={totalSKS} />
        </div>

        {/* Filter Tabs + Courses Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <Tabs
            value={filterSemester}
            onValueChange={setFilterSemester}
            className="border-b border-outline-variant bg-surface-container-low"
          >
            <TabsList className="w-full rounded-none bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-none px-5 h-11 border-b-2 border-transparent -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-none whitespace-nowrap font-medium"
              >
                Semua
              </TabsTrigger>
              {semesters.map((s) => (
                <TabsTrigger
                  key={s}
                  value={String(s)}
                  className="flex-1 rounded-none px-5 h-11 border-b-2 border-transparent -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-none whitespace-nowrap font-medium"
                >
                  Semester {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                <TableHead className="w-24">Kode</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead className="w-20 text-center">Semester</TableHead>
                <TableHead className="w-16 text-center">SKS</TableHead>
                <TableHead className="w-16 text-center">CLO</TableHead>
                <TableHead className="w-28 text-center">Nilai</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 font-body text-sm text-on-surface-variant">
                    {courses.length === 0
                      ? "Belum ada mata kuliah / nilai yang tercatat untuk Anda."
                      : "Tidak ada mata kuliah untuk semester ini."}
                  </TableCell>
                </TableRow>
              ) : filteredCourses.map((course) => {
                const isExpanded = expandedCourse === course.matkul.id;
                const avgDisplay = course.avgScore != null
                  ? course.avgScore.toFixed(1)
                  : "—";
                return (
                  <React.Fragment key={course.matkul.id}>
                    <TableRow
                      onClick={() => setExpandedCourse(isExpanded ? null : course.matkul.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="font-label text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {course.matkul.kode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-body text-sm font-medium text-on-background">
                          {course.matkul.nama}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-label text-sm text-on-surface-variant">
                        {course.matkul.semester ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-label text-sm text-on-surface-variant">
                        {course.matkul.sks ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-label text-sm font-bold text-on-background">
                        {course.totalClos}
                      </TableCell>
                      <TableCell className="text-center">
                        {course.avgScore != null ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-xs font-bold ${gradeColor(course.avgScore)}`}>
                            {avgDisplay}
                          </span>
                        ) : (
                          <span className="font-label text-xs text-on-surface-variant">Belum dinilai</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Icon
                          name={isExpanded ? "expand_less" : "expand_more"}
                          className="text-on-surface-variant"
                          size={20}
                        />
                      </TableCell>
                    </TableRow>

                    {isExpanded && course.clos.length > 0 && (
                      <TableRow className="bg-surface-container-low/50 hover:bg-surface-container-low/50">
                        <TableCell colSpan={7} className="p-0">
                          <div className="py-2 px-4">
                            <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                              Course Learning Outcomes (CLO)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {isExpanded && course.clos.map((clo) => (
                      <TableRow
                        key={`${course.matkul.id}-${clo.id}`}
                        className="bg-surface-container-low/30 hover:bg-surface-container-low/50"
                      >
                        <TableCell colSpan={5}>
                          <div className="pl-10 py-2 flex items-center gap-2">
                            <span className="font-label text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded whitespace-nowrap">
                              {clo.clo_code ?? "—"}
                            </span>
                            <span className="font-body text-sm text-on-surface-variant">
                              {clo.clo_text}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {clo.grade != null ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-full font-label text-xs font-bold ${gradeColor(clo.grade)}`}>
                              {clo.grade}
                            </span>
                          ) : (
                            <span className="font-label text-xs text-on-surface-variant">—</span>
                          )}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="font-body text-sm font-semibold text-on-background wrap-break-word">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  iconBg,
  iconText,
  label,
  value,
}: {
  icon: string;
  iconBg: string;
  iconText: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon name={icon} className={iconText} size={20} />
      </div>
      <p className="font-label text-xs text-on-surface-variant">{label}</p>
      <p className="font-headline text-2xl font-bold text-on-background">{value}</p>
    </div>
  );
}
