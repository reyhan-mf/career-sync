"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useMemo } from "react";
import { useStudentData } from "../StudentDataProvider";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: "Baru", cls: "bg-blue-50 text-blue-700" },
  reviewed: { label: "Dalam Review", cls: "bg-tertiary-fixed text-on-tertiary-container" },
  interview: { label: "Interview", cls: "bg-green-50 text-green-700" },
  accepted: { label: "Diterima", cls: "bg-green-100 text-green-800" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700" },
};

function gradePoint(grade: string | null): number | null {
  if (!grade) return null;
  const map: Record<string, number> = {
    A: 4.0,
    AB: 3.5,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    BC: 2.5,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    D: 1.0,
    E: 0,
  };
  return map[grade] ?? null;
}

function matchBadge(score: number | null) {
  const m = score ?? 0;
  if (m >= 85) return "bg-green-50 text-green-700";
  if (m >= 75) return "bg-primary-fixed text-primary";
  return "bg-tertiary-fixed text-on-tertiary-container";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function StudentDashboard() {
  const { profile, transcript, jobs, applications, loading, error } = useStudentData();

  const stats = useMemo(() => {
    const allGrades = transcript.flatMap((c) => c.clos.map((cl) => gradePoint(cl.grade)));
    const graded = allGrades.filter((g): g is number => g !== null);
    const totalClos = allGrades.length;
    const achievedClos = graded.length;
    const ipk = graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : 0;
    return {
      ipk: ipk.toFixed(2),
      cloAchieved: achievedClos,
      cloTotal: totalClos,
      jobsCount: jobs.length,
      activeApplications: applications.filter((a) => a.status !== "rejected" && a.status !== "accepted").length,
    };
  }, [transcript, jobs, applications]);

  // Top matkul: rank by average grade for matkul with at least one graded CLO.
  const topCourses = useMemo(() => {
    return transcript
      .map((course) => {
        const points = course.clos
          .map((c) => gradePoint(c.grade))
          .filter((p): p is number => p !== null);
        if (points.length === 0) return null;
        const avg = points.reduce((a, b) => a + b, 0) / points.length;
        return { name: course.matkul.nama, avg };
      })
      .filter((x): x is { name: string; avg: number } => x !== null)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  }, [transcript]);

  const recentJobs = jobs.slice(0, 3);
  const recentApplications = applications.slice(0, 3);

  if (loading && !profile) {
    return (
      <div className="max-w-6xl mx-auto py-10 text-center font-body text-sm text-on-surface-variant">
        Memuat data...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="error" size={48} className="text-error mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Gagal memuat dashboard</h1>
        <p className="font-body text-on-surface-variant">{error}</p>
      </div>
    );
  }

  const studentName = profile?.student.name ?? "Mahasiswa";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">
          Selamat Datang, {studentName}
        </h1>
        <p className="font-body text-on-surface-variant">
          Track your career journey and discover matching opportunities.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="grade"
          label="IPK"
          value={stats.ipk}
          iconBgClass="bg-primary-fixed"
          iconTextClass="text-primary"
        />
        <StatCard
          icon="school"
          label="CLO Tercapai"
          value={`${stats.cloAchieved}/${stats.cloTotal}`}
          iconBgClass="bg-green-50"
          iconTextClass="text-green-700"
        />
        <StatCard icon="work" label="Lowongan Aktif" value={stats.jobsCount} />
        <StatCard
          icon="description"
          label="Lamaran Aktif"
          value={stats.activeApplications}
          iconBgClass="bg-tertiary-fixed"
          iconTextClass="text-tertiary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-xl font-bold text-on-background">
              Rekomendasi Lowongan Terbaru
            </h2>
            <Link href="/student/job-matching" className="font-label text-sm text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant py-6 text-center">
              Belum ada lowongan aktif.
            </p>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/student/jobs/${job.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors group"
                >
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center">
                    <Icon name="work" className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-on-background group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h3>
                    <p className="font-label text-sm text-on-surface-variant truncate">
                      {[job.location ?? "—", job.job_type ?? "—"].join(" · ")}
                    </p>
                  </div>
                  {job.category && (
                    <span className="px-3 py-1 rounded-full font-label text-xs font-bold bg-primary-fixed text-primary shrink-0">
                      {job.category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-lg font-bold text-on-background">
              Mata Kuliah Terbaik
            </h2>
            <Link href="/student/profile" className="font-label text-sm text-primary hover:underline">
              Detail
            </Link>
          </div>
          {topCourses.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant text-center py-4">
              Belum ada nilai yang tercatat.
            </p>
          ) : (
            <div className="space-y-5">
              {topCourses.map((c) => (
                <div key={c.name} className="flex justify-between items-center gap-3">
                  <span className="font-label text-sm text-on-surface-variant truncate">{c.name}</span>
                  <span className="px-3 py-1 rounded-full font-label text-xs font-bold bg-green-50 text-green-700 shrink-0">
                    {c.avg.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-xl font-bold text-on-background">Lamaran Terbaru</h2>
          <Link href="/student/applications" className="font-label text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant py-4 text-center">
            Anda belum mengirim lamaran.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Posisi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentApplications.map((app) => {
                const sl = STATUS_LABELS[app.status] ?? { label: app.status, cls: "bg-surface-container text-on-surface-variant" };
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-body text-sm text-on-background">
                      {app.jobs?.title ?? "—"}
                    </TableCell>
                    <TableCell className="font-label text-sm text-on-surface-variant">
                      {formatDate(app.applied_at)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full font-label text-xs font-bold ${matchBadge(app.match_score)}`}>
                        {app.match_score ?? 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full font-label text-xs font-semibold ${sl.cls}`}>
                        {sl.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
