"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  applicantStatusColor,
  applicantStatusLabel,
  companyProfile,
  initialApplicants,
  initialHRJobs,
  initialTalents,
  matchColorClass,
} from "@/lib/hr-mock";
import Link from "next/link";
import React from "react";

export default function HRDashboard() {
  const recentApplicants = [...initialApplicants]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  const activeJobs = initialHRJobs.filter((j) => j.status === "active");
  const totalApplicants = initialApplicants.length;
  const interviewCount = initialApplicants.filter(
    (a) => a.status === "interview",
  ).length;

  const topTalents = [...initialTalents]
    .filter((t) => t.inviteStatus === "not_contacted")
    .sort((a, b) => b.match - a.match)
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ─── Company Profile Header ─── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-ambient ghost-border">
        <div className="flex items-start gap-5">
          <div
            className={`w-16 h-16 lg:w-20 lg:h-20 ${companyProfile.logoBgClass} rounded-2xl flex items-center justify-center shrink-0`}
          >
            <Icon
              name={companyProfile.logoIcon}
              className={companyProfile.logoTextClass}
              size={36}
              filled
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-background">
                    {companyProfile.name}
                  </h1>
                  {companyProfile.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-fixed text-primary rounded-full font-label text-xs font-semibold">
                      <Icon name="verified" size={14} filled />
                      Verified
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-on-surface-variant italic mt-0.5">
                  {companyProfile.tagline}
                </p>
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
                { icon: "domain", text: companyProfile.industry },
                { icon: "location_on", text: companyProfile.location },
                { icon: "groups", text: companyProfile.size },
                { icon: "language", text: companyProfile.website },
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
        <StatCard
          icon="work"
          label="Lowongan Aktif"
          value={activeJobs.length}
        />
        <StatCard
          icon="group"
          label="Total Pelamar"
          value={totalApplicants}
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
          value={initialTalents.length}
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
            {recentApplicants.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <div className="w-9 h-9 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-primary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-on-background truncate">
                    {a.name}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant truncate">
                    {a.position} · {a.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(a.match)}`}
                  >
                    {a.match}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${applicantStatusColor[a.status]}`}
                  >
                    {applicantStatusLabel[a.status]}
                  </span>
                </div>
              </div>
            ))}
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
            {topTalents.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <div className="w-9 h-9 bg-tertiary-fixed rounded-full flex items-center justify-center shrink-0">
                  <Icon name="auto_awesome" className="text-tertiary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-on-background truncate">
                    {t.name}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant truncate">
                    {t.university} · cocok untuk {t.bestMatchJobTitle}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-label text-xs font-bold shrink-0 ${matchColorClass(t.match)}`}
                >
                  {t.match}%
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
                {job.location} · {job.type}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-label text-xs text-on-surface-variant">
                  Deadline {job.deadline}
                </span>
                <span className="inline-flex items-center gap-1 font-label text-xs font-bold text-primary">
                  <Icon name="group" size={14} />
                  {job.applicants}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
