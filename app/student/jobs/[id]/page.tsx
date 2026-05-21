"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import TopBar from "@/components/layout/TopBar";
import { getJobById, type JobDetail } from "@/lib/supabase/student-queries";
import { reportStudentError } from "@/lib/supabase/studentErrors";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ScoreRingPlaceholder() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle
          cx="56"
          cy="56"
          r={42}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-surface-container"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-headline text-2xl font-bold text-on-surface-variant">—</p>
        <p className="font-label text-[10px] text-on-surface-variant">match</p>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "analysis">("overview");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getJobById(params.id)
      .then((data) => {
        if (!alive) return;
        if (!data) {
          setNotFound(true);
        } else {
          setJob(data);
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(reportStudentError(e, "jobs.detail.load"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [params?.id]);

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="max-w-5xl mx-auto p-6 lg:p-10">
          <p className="font-body text-sm text-on-surface-variant">Memuat detail lowongan…</p>
        </div>
      </>
    );
  }

  if (notFound || !job) {
    return (
      <>
        <TopBar />
        <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-4">
          <Link
            href="/student/job-matching"
            className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" size={18} /> Kembali ke Job Matching
          </Link>
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border text-center">
            <Icon name="search_off" size={48} className="text-on-surface-variant mb-2" />
            <h1 className="font-headline text-xl font-bold text-on-background">
              Lowongan tidak ditemukan
            </h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Lowongan ini mungkin sudah dihapus atau ditutup oleh perusahaan.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <div className="max-w-5xl mx-auto p-6 lg:p-10">
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      </>
    );
  }

  const companyName = job.company?.name ?? "—";
  const locationText = job.location ?? job.company?.location ?? "—";

  return (
    <>
      <TopBar />
      <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Back */}
        <Link
          href="/student/job-matching"
          className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Kembali ke Job Matching
        </Link>

        {/* ── Job Header ── */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                <Icon
                  name={job.company?.logo_icon || "business"}
                  className="text-primary"
                  size={28}
                />
              </div>
              <div>
                <h1 className="font-headline text-2xl font-bold text-on-background">{job.title}</h1>
                <p className="font-body text-on-surface-variant">{companyName}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { icon: "location_on", text: locationText },
                    { icon: "work", text: job.job_type ?? "—" },
                    { icon: "payments", text: job.salary ?? "—" },
                    { icon: "event", text: `Deadline: ${formatDate(job.deadline)}` },
                  ].map((info) => (
                    <span
                      key={info.icon}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full font-label text-xs text-on-surface-variant"
                    >
                      <Icon name={info.icon} size={13} /> {info.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 shrink-0">
              <ScoreRingPlaceholder />
              <button className="btn-gradient rounded-xl px-8 py-3 font-label font-bold shadow-[0_4px_14px_rgb(9,76,178,0.25)] flex items-center gap-2 whitespace-nowrap">
                <Icon name="send" size={18} /> Lamar Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
          {(["overview", "analysis"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-label text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-ambient"
                  : "text-on-surface-variant hover:text-on-background"
              }`}
            >
              {tab === "overview" ? "Gambaran Umum" : "Analisis Kompetensi"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Description + Skills */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-xl font-bold text-on-background mb-3">
                  Deskripsi
                </h2>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {job.description?.trim() || "Belum ada deskripsi."}
                </p>
              </div>

              {job.job_skills.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                  <h2 className="font-headline text-xl font-bold text-on-background mb-4">
                    Keahlian yang Dibutuhkan
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.job_skills.map((s) => (
                      <span
                        key={s.skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-primary rounded-full font-label text-xs font-medium"
                      >
                        <Icon name="code" size={13} /> {s.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Company + match placeholder */}
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-lg font-bold text-on-background mb-3">
                  Perusahaan
                </h2>
                <div className="space-y-2">
                  <p className="font-body text-sm font-semibold text-on-background">
                    {companyName}
                  </p>
                  {job.company?.industry && (
                    <p className="font-body text-xs text-on-surface-variant inline-flex items-center gap-1.5">
                      <Icon name="domain" size={13} /> {job.company.industry}
                    </p>
                  )}
                  {job.company?.location && (
                    <p className="font-body text-xs text-on-surface-variant inline-flex items-center gap-1.5">
                      <Icon name="location_on" size={13} /> {job.company.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-lg font-bold text-on-background mb-2">
                  Ringkasan Kecocokan
                </h2>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  Analisis kompetensi akan ditampilkan setelah fitur pencocokan diaktifkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {job.requirements.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                  <p className="font-body text-sm text-on-surface-variant">
                    Perusahaan belum menambahkan daftar kualifikasi untuk lowongan ini.
                  </p>
                </div>
              ) : (
                job.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-surface-container">
                        <Icon name="checklist" className="text-on-surface-variant" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="font-body text-sm font-semibold text-on-background">
                            {req.req_text}
                          </p>
                          <span className="font-label text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant shrink-0">
                            —
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-container rounded-full mt-2" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-primary-fixed/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" className="text-primary mt-0.5 shrink-0" size={18} />
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    Skor kecocokan per kualifikasi akan tersedia setelah model pencocokan
                    kompetensi diintegrasikan. Saat ini hanya menampilkan daftar kualifikasi
                    dari perusahaan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
