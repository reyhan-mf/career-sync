"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCardSkeleton, StatGridSkeleton } from "@/components/ui/Skeletons";
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
  const { profile, transcript, jobs, applications, matchScores, loading, error } = useStudentData();

  const stats = useMemo(() => {
    const allGrades = transcript.flatMap((c) => c.clos.map((cl) => cl.grade));
    const graded = allGrades.filter((g): g is number => typeof g === "number");
    const totalClos = allGrades.length;
    const achievedClos = graded.length;
    const avg = graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : 0;
    return {
      ipk: avg.toFixed(1),
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
        const scores = course.clos
          .map((c) => c.grade)
          .filter((g): g is number => typeof g === "number");
        if (scores.length === 0) return null;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { name: course.matkul.nama, avg };
      })
      .filter((x): x is { name: string; avg: number } => x !== null)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  }, [transcript]);

  // Top 3 rekomendasi: peringkat berdasarkan skor kecocokan (match score).
  // Skor null (mis. mahasiswa belum punya nilai) ditempatkan paling akhir.
  const recommendedJobs = useMemo(() => {
    return jobs
      .map((job) => ({ ...job, matchScore: matchScores[job.id] ?? null }))
      .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
      .slice(0, 3);
  }, [jobs, matchScores]);

  const recentApplications = applications.slice(0, 3);

  if (loading && !profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <StatGridSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ListCardSkeleton rows={3} />
          </div>
          <ListCardSkeleton rows={4} />
        </div>
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
          label="Rerata Nilai"
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
          {recommendedJobs.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant py-6 text-center">
              Belum ada lowongan aktif.
            </p>
          ) : (
            <div className="space-y-4">
              {recommendedJobs.map((job) => (
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
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label text-xs font-bold shrink-0 ${matchBadge(job.matchScore)}`}>
                    <Icon name="bolt" size={12} />
                    {job.matchScore != null ? `${job.matchScore}%` : "—"}
                  </span>
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
                    {c.avg.toFixed(1)}
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
