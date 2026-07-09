"use client";

import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  jobStatusColor,
  jobStatusLabel,
  matchColorClass,
  type JobStatus,
} from "@/lib/hr-mock";
import {
  gradesByCloId,
  matchScoreFromRbc,
  rbcByJobId,
} from "@/lib/hr-match";
import type { TalentCLOGrade } from "@/lib/supabase/hr-queries";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHRData } from "../HRDataProvider";

// Per-job aggregate of the passive talent pool: how many active students match
// this job's qualifications, and how strong the best fit is. `hasReq` is false
// when the job has no embedded requirements yet (matching impossible).
interface JobPoolStats {
  hasReq: boolean;
  total: number;
  strong: number; // match ≥ 85%
  good: number; // match ≥ 70%
  top: number; // highest match score, 0 when none
  invited: number;
}

export default function TalentPoolPage() {
  const { company, jobs, talents, talentGrades, reqBestClos, invitations, loading, error } =
    useHRData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, TalentCLOGrade[]>();
    talentGrades.forEach((g) => {
      const list = map.get(g.student_id) ?? [];
      list.push(g);
      map.set(g.student_id, list);
    });
    return map;
  }, [talentGrades]);

  // Precompute each student's cloId→grade map once — reused across every job.
  const gradeMapByStudent = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    talents.forEach((t) => {
      map.set(t.id, gradesByCloId(gradesByStudent.get(t.id) ?? []));
    });
    return map;
  }, [talents, gradesByStudent]);

  const rbcByJob = useMemo(() => rbcByJobId(reqBestClos), [reqBestClos]);

  const invitedByJob = useMemo(() => {
    const map = new Map<string, number>();
    invitations.forEach((i) => {
      if (i.job_id) map.set(i.job_id, (map.get(i.job_id) ?? 0) + 1);
    });
    return map;
  }, [invitations]);

  const statsByJob = useMemo(() => {
    const map = new Map<string, JobPoolStats>();
    jobs.forEach((job) => {
      const rbc = rbcByJob.get(job.id) ?? [];
      if (rbc.length === 0) {
        map.set(job.id, {
          hasReq: false,
          total: 0,
          strong: 0,
          good: 0,
          top: 0,
          invited: invitedByJob.get(job.id) ?? 0,
        });
        return;
      }
      let strong = 0;
      let good = 0;
      let top = 0;
      talents.forEach((t) => {
        const score = matchScoreFromRbc(gradeMapByStudent.get(t.id) ?? new Map(), rbc) ?? 0;
        if (score >= 85) strong += 1;
        if (score >= 70) good += 1;
        if (score > top) top = score;
      });
      map.set(job.id, {
        hasReq: true,
        total: talents.length,
        strong,
        good,
        top,
        invited: invitedByJob.get(job.id) ?? 0,
      });
    });
    return map;
  }, [jobs, rbcByJob, talents, gradeMapByStudent, invitedByJob]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs
      .filter((j) => {
        const matchesSearch =
          !q ||
          j.title.toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || j.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      // Jobs with a stronger best-match float to the top; jobs without
      // requirements sink to the bottom.
      .sort((a, b) => (statsByJob.get(b.id)?.top ?? 0) - (statsByJob.get(a.id)?.top ?? 0));
  }, [jobs, search, statusFilter, statsByJob]);

  const activeCount = jobs.filter(
    (j) => j.status === "active" || j.status === "closing",
  ).length;
  const jobsWithoutReq = jobs.filter(
    (j) => (statsByJob.get(j.id)?.hasReq ?? false) === false,
  ).length;

  if (loading && jobs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border space-y-2"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border space-y-3"
            >
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-full font-label text-xs font-semibold text-tertiary">
          <Icon name="diversity_3" size={14} filled />
          Talent Pool per Lowongan
        </div>
        <h1 className="font-headline text-3xl font-bold text-on-background">
          Talent Pool
        </h1>
        <p className="font-body text-on-surface-variant max-w-2xl">
          Pilih salah satu lowongan {company?.name ? `${company.name} ` : ""}untuk
          melihat mahasiswa aktif yang paling cocok dengan kualifikasinya. Untuk
          pelamar aktif, lihat{" "}
          <Link
            href="/hr/applicants"
            className="text-primary font-semibold hover:underline"
          >
            Daftar Pelamar
          </Link>
          .
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox label="Lowongan Aktif" value={activeCount} tone="green" />
        <StatBox label="Kandidat Aktif" value={talents.length} tone="tertiary" />
        <StatBox label="Tanpa Kualifikasi" value={jobsWithoutReq} tone="on-surface" />
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            placeholder="Cari lowongan berdasarkan judul atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 lg:min-w-44 w-auto">
            <Icon name="filter_list" size={16} className="text-on-surface-variant" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {(Object.keys(jobStatusLabel) as JobStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {jobStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-ambient ghost-border">
          <Icon
            name="work_off"
            size={40}
            className="text-on-surface-variant mx-auto mb-3"
          />
          <p className="font-body text-sm text-on-surface-variant">
            {jobs.length === 0 ? (
              <>
                Belum ada lowongan.{" "}
                <Link href="/hr/jobs?new=1" className="text-primary hover:underline">
                  Buat lowongan
                </Link>{" "}
                terlebih dahulu untuk membangun talent pool.
              </>
            ) : (
              "Tidak ada lowongan yang cocok dengan pencarian."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => {
            const stats = statsByJob.get(job.id);
            const hasReq = stats?.hasReq ?? false;
            return (
              <Link
                key={job.id}
                href={`/hr/talent-pool/${job.id}`}
                className="group bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-label text-xs font-semibold px-2.5 py-0.5 rounded-full ${jobStatusColor[job.status as JobStatus] ?? ""}`}
                    >
                      {jobStatusLabel[job.status as JobStatus] ?? job.status}
                    </span>
                    {job.job_type && (
                      <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                        {job.job_type}
                      </span>
                    )}
                  </div>
                  {hasReq && stats && stats.top > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-bold shrink-0 ${matchColorClass(stats.top)}`}
                    >
                      Top {stats.top}%
                    </span>
                  )}
                </div>

                <h3 className="font-headline text-lg font-bold text-on-background mt-2 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant mt-1">
                    <Icon name="location_on" size={14} /> {job.location}
                  </span>
                )}

                <div className="mt-4 flex-1">
                  {hasReq && stats ? (
                    stats.strong > 0 || stats.good > 0 || stats.invited > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {stats.strong > 0 && (
                          <PoolChip
                            icon="workspace_premium"
                            label={`${stats.strong} kandidat kuat`}
                            tone="green"
                          />
                        )}
                        {stats.good > 0 && (
                          <PoolChip
                            icon="thumb_up"
                            label={`${stats.good} cocok`}
                            tone="primary"
                          />
                        )}
                        {stats.invited > 0 && (
                          <PoolChip
                            icon="forward_to_inbox"
                            label={`${stats.invited} diundang`}
                            tone="neutral"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant">
                        <Icon name="person_search" size={14} />
                        Belum ada kandidat yang cocok
                      </span>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1.5 font-label text-xs text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
                      <Icon name="warning" size={14} />
                      Belum ada kualifikasi
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="font-label text-sm font-semibold text-primary">
                    {hasReq ? "Lihat Talent Pool" : "Tambah Kualifikasi"}
                  </span>
                  <Icon
                    name="arrow_forward"
                    size={18}
                    className="text-primary group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PoolChip({
  icon,
  label,
  tone,
}: {
  icon: string;
  label: string;
  tone: "green" | "primary" | "neutral";
}) {
  const toneClass = {
    green: "text-green-700 bg-green-50",
    primary: "text-primary bg-primary-fixed",
    neutral: "text-on-surface-variant bg-surface-container",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label text-xs font-semibold rounded-full px-2.5 py-1 ${toneClass}`}
    >
      <Icon name={icon} size={13} />
      {label}
    </span>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "tertiary" | "green" | "on-surface";
}) {
  const toneClass = {
    primary: "text-primary",
    tertiary: "text-tertiary",
    green: "text-green-700",
    "on-surface": "text-on-surface-variant",
  }[tone];
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
      <p className="font-label text-sm text-on-surface-variant">{label}</p>
      <p className={`font-headline text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}
