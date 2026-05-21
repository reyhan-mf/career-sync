"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  applicantStatusColor,
  applicantStatusLabel,
  matchColorClass,
  type ApplicantStatus,
} from "@/lib/hr-mock";
import { bestMatchJob } from "@/lib/hr-match";
import type { TalentCLOGrade } from "@/lib/supabase/hr-queries";
import Link from "next/link";
import React, { useMemo } from "react";
import { useHRData } from "../HRDataProvider";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HRDashboard() {
  const data = useHRData();
  const { hr, company, jobs, applications, talents, talentGrades, invitations, loading, error } = data;

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, TalentCLOGrade[]>();
    talentGrades.forEach((g) => {
      const list = map.get(g.student_id) ?? [];
      list.push(g);
      map.set(g.student_id, list);
    });
    return map;
  }, [talentGrades]);

  const recentApplicants = useMemo(
    () =>
      [...applications]
        .sort((a, b) => {
          const ta = a.applied_at ? new Date(a.applied_at).getTime() : 0;
          const tb = b.applied_at ? new Date(b.applied_at).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 4),
    [applications],
  );

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "active" || j.status === "closing"),
    [jobs],
  );

  const applicantCountByJob = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((a) => {
      if (!a.job_id) return;
      map.set(a.job_id, (map.get(a.job_id) ?? 0) + 1);
    });
    return map;
  }, [applications]);

  const interviewCount = useMemo(
    () => applications.filter((a) => a.status === "interview").length,
    [applications],
  );

  const invitedIds = useMemo(
    () => new Set(invitations.map((i) => i.student_id).filter(Boolean) as string[]),
    [invitations],
  );

  const topTalents = useMemo(() => {
    if (talents.length === 0 || activeJobs.length === 0) return [];
    return talents
      .filter((t) => !invitedIds.has(t.id))
      .map((t) => {
        const grades = gradesByStudent.get(t.id) ?? [];
        const best = bestMatchJob(grades, activeJobs);
        return {
          talent: t,
          job: best?.job ?? null,
          score: best?.score ?? 0,
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [talents, gradesByStudent, activeJobs, invitedIds]);

  const companyDisplay = {
    name: company?.name ?? "Perusahaan Anda",
    industry: company?.industry ?? "Industri belum diisi",
    location: company?.location ?? "Lokasi belum diisi",
    size: company?.size ?? "Ukuran belum diisi",
    website: company?.website ?? "—",
    logoIcon: company?.logo_icon ?? "storefront",
    verified: !!company?.verified,
  };

  if (loading && !hr) {
    return (
      <div className="max-w-6xl mx-auto p-10 text-center font-body text-sm text-on-surface-variant">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
          {error}
        </div>
      )}

      {/* ─── Company Profile Header ─── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-ambient ghost-border">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-fixed rounded-2xl flex items-center justify-center shrink-0">
            <Icon
              name={companyDisplay.logoIcon}
              className="text-primary"
              size={36}
              filled
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-background">
                    {companyDisplay.name}
                  </h1>
                  {companyDisplay.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-fixed text-primary rounded-full font-label text-xs font-semibold">
                      <Icon name="verified" size={14} filled />
                      Verified
                    </span>
                  )}
                </div>
                {hr && (
                  <p className="font-body text-sm text-on-surface-variant mt-0.5">
                    {hr.name}
                    {hr.position ? ` · ${hr.position}` : ""}
                  </p>
                )}
              </div>
              <Link
                href="/hr/jobs?new=1"
                className="btn-gradient font-label font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)] shrink-0"
              >
                <Icon name="add" size={18} />
                Buat Lowongan
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              {[
                { icon: "domain", text: companyDisplay.industry },
                { icon: "location_on", text: companyDisplay.location },
                { icon: "groups", text: companyDisplay.size },
                { icon: "language", text: companyDisplay.website },
              ].map((m) => (
                <span
                  key={m.icon}
                  className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant"
                >
                  <Icon name={m.icon} size={14} />
                  {m.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="work" label="Lowongan Aktif" value={activeJobs.length} />
        <StatCard
          icon="group"
          label="Total Pelamar"
          value={applications.length}
          iconBgClass="bg-green-50"
          iconTextClass="text-green-700"
        />
        <StatCard
          icon="event"
          label="Interview Berjalan"
          value={interviewCount}
          iconBgClass="bg-blue-50"
          iconTextClass="text-blue-700"
        />
        <StatCard
          icon="diversity_3"
          label="Talent Pool"
          value={talents.length}
          iconBgClass="bg-tertiary-fixed"
          iconTextClass="text-tertiary"
        />
      </div>

      {/* ─── Recent Applicants & Top Talents ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applicants */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-background">
                Pelamar Terbaru
              </h2>
              <p className="font-label text-xs text-on-surface-variant">
                Pelamar yang masuk ke lowongan Anda
              </p>
            </div>
            <Link
              href="/hr/applicants"
              className="font-label text-sm text-primary hover:underline shrink-0"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-2">
            {recentApplicants.length === 0 && (
              <p className="font-body text-sm text-on-surface-variant text-center py-6">
                Belum ada pelamar.
              </p>
            )}
            {recentApplicants.map((a) => {
              const match =
                a.match_score !== null && a.match_score !== undefined
                  ? Math.round((a.match_score ?? 0) * 100)
                  : null;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <div className="w-9 h-9 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                    <Icon name="person" className="text-primary" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-on-background truncate">
                      {a.students?.name ?? "—"}
                    </p>
                    <p className="font-label text-xs text-on-surface-variant truncate">
                      {a.jobs?.title ?? "—"} · {formatDate(a.applied_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {match !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(match)}`}
                      >
                        {match}%
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${applicantStatusColor[a.status as ApplicantStatus] ?? ""}`}
                    >
                      {applicantStatusLabel[a.status as ApplicantStatus] ?? a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Talents */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-background">
                Talent Teratas
              </h2>
              <p className="font-label text-xs text-on-surface-variant">
                Kandidat match — siap diundang melamar
              </p>
            </div>
            <Link
              href="/hr/talent-pool"
              className="font-label text-sm text-primary hover:underline shrink-0"
            >
              Lihat Pool
            </Link>
          </div>
          <div className="space-y-2">
            {topTalents.length === 0 && (
              <p className="font-body text-sm text-on-surface-variant text-center py-6">
                {activeJobs.length === 0
                  ? "Belum ada lowongan aktif untuk mencocokkan talent."
                  : "Belum ada talent yang cocok."}
              </p>
            )}
            {topTalents.map((row) => (
              <div
                key={row.talent.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <div className="w-9 h-9 bg-tertiary-fixed rounded-full flex items-center justify-center shrink-0">
                  <Icon name="auto_awesome" className="text-tertiary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-on-background truncate">
                    {row.talent.name}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant truncate">
                    NIM {row.talent.nim}
                    {row.job ? ` · cocok untuk ${row.job.title}` : ""}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-label text-xs font-bold shrink-0 ${matchColorClass(row.score)}`}
                >
                  {row.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Active Jobs Overview ─── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-headline text-lg font-bold text-on-background">
              Lowongan Aktif
            </h2>
            <p className="font-label text-xs text-on-surface-variant">
              Posisi yang sedang membuka pendaftaran
            </p>
          </div>
          <Link
            href="/hr/jobs"
            className="font-label text-sm text-primary hover:underline"
          >
            Kelola
          </Link>
        </div>
        {activeJobs.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant text-center py-8">
            Belum ada lowongan aktif. Mulai dengan{" "}
            <Link href="/hr/jobs?new=1" className="text-primary hover:underline">
              membuat lowongan baru
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeJobs.map((job) => (
              <Link
                key={job.id}
                href={`/hr/applicants?job=${job.id}`}
                className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors block"
              >
                <p className="font-body text-sm font-bold text-on-background">
                  {job.title}
                </p>
                <p className="font-label text-xs text-on-surface-variant mt-0.5">
                  {job.location ?? "—"}
                  {job.job_type ? ` · ${job.job_type}` : ""}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-label text-xs text-on-surface-variant">
                    Deadline {formatDate(job.deadline)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-label text-xs font-bold text-primary">
                    <Icon name="group" size={14} />
                    {applicantCountByJob.get(job.id) ?? 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
