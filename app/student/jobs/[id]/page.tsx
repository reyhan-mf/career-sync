"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import TopBar from "@/components/layout/TopBar";
import {
  applyToJob,
  getJobById,
  getJobMatchBreakdown,
  type JobDetail,
  type ReqMatchBreakdown,
} from "@/lib/supabase/student-queries";
import { useStudentData } from "@/app/student/StudentDataProvider";
import { studentDataMutators } from "@/lib/supabase/studentDataStore";
import GradeBasisToggle, {
  STUDENT_BASIS_OPTIONS,
} from "@/components/ui/GradeBasisToggle";
import type { AssessmentMode } from "@/lib/supabase/superadmin-queries";
import { reportStudentError } from "@/lib/supabase/studentErrors";

const APPLY_STATUS_LABEL: Record<string, string> = {
  new: "Lamaran Terkirim",
  reviewed: "Sedang Ditinjau",
  interview: "Tahap Interview",
  accepted: "Diterima",
  rejected: "Ditolak",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Tailwind text-color class for a 0-100 score (null = no score yet).
function scoreColor(score: number | null): string {
  if (score == null) return "text-on-surface-variant";
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-tertiary";
  return "text-error";
}

// Stroke color for the SVG ring — mirrors scoreColor but for `stroke`.
function ringStroke(score: number | null): string {
  if (score == null) return "text-surface-container";
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-tertiary";
  return "text-error";
}

function ScoreRing({ score }: { score: number | null }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle
          cx="56" cy="56" r={r}
          fill="none" stroke="currentColor" strokeWidth="8"
          className="text-surface-container"
        />
        {score != null && (
          <circle
            cx="56" cy="56" r={r}
            fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className={`${ringStroke(score)} transition-[stroke-dashoffset] duration-700`}
          />
        )}
      </svg>
      <div className="absolute text-center">
        <p className={`font-headline text-2xl font-bold ${scoreColor(score)}`}>
          {score != null ? `${score}%` : "—"}
        </p>
        <p className="font-label text-[10px] text-on-surface-variant">match</p>
      </div>
    </div>
  );
}

// Skeleton placeholder shown while the job detail loads. Mirrors the real
// layout (header card + tabs + overview grid) so the page doesn't jump.
function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container rounded-md ${className ?? ""}`} />;
}

function JobDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
      <Sk className="h-5 w-40" />
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Sk className="w-14 h-14 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Sk className="h-7 w-56" />
              <Sk className="h-4 w-36" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Sk className="h-6 w-24 rounded-full" />
                <Sk className="h-6 w-20 rounded-full" />
                <Sk className="h-6 w-28 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <Sk className="w-28 h-28 rounded-full" />
            <Sk className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </div>
      <Sk className="h-11 w-72 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-3">
            <Sk className="h-6 w-32" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-2/3" />
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-4">
            <Sk className="h-6 w-48" />
            <div className="flex flex-wrap gap-2">
              <Sk className="h-7 w-20 rounded-full" />
              <Sk className="h-7 w-24 rounded-full" />
              <Sk className="h-7 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-3">
            <Sk className="h-5 w-28" />
            <Sk className="h-4 w-40" />
            <Sk className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { profile, matchScores, applications, gradeBasis, transcript } = useStudentData();
  const studentId = profile?.student.id ?? null;
  // The basis toggle is only meaningful when the student actually has CLO-level
  // grades to compare against — a prodi that records only final course grades
  // would just be offered an all-zero view.
  const hasCloGrades = useMemo(
    () => transcript.some((c) => c.clos.some((clo) => clo.grade != null)),
    [transcript],
  );
  const [activeTab, setActiveTab] = useState<"overview" | "analysis">("overview");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  // Single load-state object so the loading effect never has to call setState
  // synchronously in its body (which triggers cascading renders).
  const [loadState, setLoadState] = useState<{
    status: "loading" | "ready" | "notfound" | "error";
    job: JobDetail | null;
    error: string | null;
  }>({ status: "loading", job: null, error: null });
  // The rows are stored together with the basis they were fetched for, so
  // "still loading" is derived rather than tracked in a second state — the
  // effect below must not call setState synchronously in its body.
  const [breakdownState, setBreakdownState] = useState<{
    rows: ReqMatchBreakdown[];
    basis: AssessmentMode | null;
  }>({ rows: [], basis: null });
  const breakdown = breakdownState.rows;
  // Right after the basis is switched the rows still describe the previous one.
  const breakdownLoading = !!studentId && breakdownState.basis !== gradeBasis;
  // requirement_ids whose detail table is expanded.
  const [openReqs, setOpenReqs] = useState<Set<string>>(new Set());

  const { status, job, error } = loadState;
  const loading = status === "loading";
  const notFound = status === "notfound";

  useEffect(() => {
    if (!params?.id) return;
    let alive = true;
    getJobById(params.id)
      .then((data) => {
        if (!alive) return;
        if (!data) setLoadState({ status: "notfound", job: null, error: null });
        else setLoadState({ status: "ready", job: data, error: null });
      })
      .catch((e) => {
        if (!alive) return;
        setLoadState({
          status: "error",
          job: null,
          error: reportStudentError(e, "jobs.detail.load"),
        });
      });
    return () => {
      alive = false;
    };
  }, [params?.id]);

  // Per-requirement match breakdown. Needs both the job id and the logged-in
  // student; refetches if either changes.
  useEffect(() => {
    const jobId = params?.id;
    if (!jobId || !studentId) return;
    let alive = true;
    getJobMatchBreakdown(studentId, jobId, gradeBasis)
      .then((rows) => alive && setBreakdownState({ rows, basis: gradeBasis }))
      .catch(() => alive && setBreakdownState({ rows: [], basis: gradeBasis }));
    return () => {
      alive = false;
    };
  }, [params?.id, studentId, gradeBasis]);

  // Score averaged from the freshly-fetched per-requirement breakdown. This is
  // the live, authoritative value for this job.
  const breakdownScore: number | null = useMemo(() => {
    if (breakdown.length === 0) return null;
    const sum = breakdown.reduce((s, r) => s + r.contribution, 0);
    return Math.round(sum / breakdown.length);
  }, [breakdown]);

  // Overall match score: prefer the live breakdown; fall back to the value in
  // the store (same RPC as the job list) while the breakdown is still loading.
  const overallScore: number | null =
    breakdownScore ?? (params?.id ? matchScores[params.id] ?? null : null);

  // Keep the job-matching list badge in sync with the live score, so the table
  // never shows a stale value that disagrees with this page.
  useEffect(() => {
    if (params?.id && breakdownScore != null) {
      studentDataMutators.setMatchScore(params.id, breakdownScore);
    }
  }, [params?.id, breakdownScore]);

  // Top contributing competencies, for the overview summary card.
  const topMatches = useMemo(
    () => [...breakdown].sort((a, b) => b.contribution - a.contribution).slice(0, 3),
    [breakdown],
  );

  // requirement_id → breakdown row, so the analysis cards can show the matched
  // CLO + score per requirement.
  const breakdownByReq = useMemo(() => {
    const m = new Map<string, ReqMatchBreakdown>();
    for (const r of breakdown) m.set(r.requirement_id, r);
    return m;
  }, [breakdown]);

  // Has this student already applied to this job? Drives the apply button.
  const existingApplication = useMemo(
    () => applications.find((a) => a.job_id === params?.id) ?? null,
    [applications, params?.id],
  );

  async function handleApply() {
    if (!studentId || !params?.id || applying || existingApplication) return;
    setApplying(true);
    setApplyError(null);
    try {
      const app = await applyToJob(studentId, params.id, overallScore);
      studentDataMutators.addApplication(app);
    } catch (e) {
      setApplyError(reportStudentError(e, "jobs.detail.apply"));
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <JobDetailSkeleton />
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

            <div className="flex flex-col items-center gap-2 shrink-0">
              <ScoreRing score={breakdownLoading ? null : overallScore} />
              {existingApplication ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-label font-bold bg-green-50 text-green-700 whitespace-nowrap">
                    <Icon name="check_circle" size={18} />
                    {APPLY_STATUS_LABEL[existingApplication.status] ?? "Sudah Dilamar"}
                  </span>
                  <Link
                    href="/student/applications"
                    className="font-label text-xs text-primary hover:underline"
                  >
                    Lihat status lamaran
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || !studentId || job.status !== "active"}
                  className="btn-gradient rounded-xl px-8 py-3 font-label font-bold shadow-[0_4px_14px_rgb(9,76,178,0.25)] flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Icon name={applying ? "progress_activity" : "send"} size={18} className={applying ? "animate-spin" : ""} />
                  {applying ? "Mengirim…" : job.status !== "active" ? "Lowongan Ditutup" : "Lamar Sekarang"}
                </button>
              )}
              {applyError && (
                <p className="font-label text-xs text-error max-w-[12rem] text-center">{applyError}</p>
              )}
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
                <h2 className="font-headline text-lg font-bold text-on-background mb-3">
                  Ringkasan Kecocokan
                </h2>
                {!studentId ? (
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    Masuk sebagai mahasiswa untuk melihat kecocokan kompetensi Anda.
                  </p>
                ) : topMatches.length === 0 ? (
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    Belum ada data kompetensi yang cocok untuk lowongan ini.
                  </p>
                ) : (
                  <>
                    <p className="font-body text-xs text-on-surface-variant mb-3">
                      Kompetensi Anda yang paling relevan:
                    </p>
                    <ul className="space-y-2.5">
                      {topMatches.map((m) => (
                        <li key={m.requirement_id} className="flex items-center justify-between gap-2">
                          <span className="font-label text-xs text-on-surface truncate">
                            {m.clo_code ? `${m.clo_code} · ` : ""}{m.matkul_nama ?? "—"}
                          </span>
                          <span className={`font-label text-xs font-bold shrink-0 ${scoreColor(m.contribution)}`}>
                            {m.contribution}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className="mt-4 font-label text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Lihat analisis lengkap <Icon name="arrow_forward" size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-5">
            {/* Grade basis switch. Only the grade term changes — the matching
                itself is always CLO-text similarity, in both bases. */}
            {hasCloGrades && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label text-sm font-semibold text-on-background">
                    Basis nilai
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    Pilih nilai mana yang dipakai membobot kemiripan.
                  </p>
                </div>
                <div className="shrink-0">
                  <GradeBasisToggle
                    value={gradeBasis}
                    options={STUDENT_BASIS_OPTIONS}
                    onChange={(v) => studentDataMutators.setGradeBasis(v)}
                    disabled={breakdownLoading}
                  />
                </div>
              </div>
            )}

            {/* How scoring works */}
            <div className="bg-primary-fixed/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-primary mt-0.5 shrink-0" size={18} />
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  Tiap kualifikasi dicocokkan ke CLO yang paling mirip, lalu skornya =
                  kemiripan × {gradeBasis === "course"
                    ? "nilai akhir mata kuliah pemilik CLO tersebut"
                    : "nilai Anda pada CLO tersebut"}
                  . Kualifikasi tanpa CLO yang relevan atau yang belum Anda ambil akan
                  bernilai rendah.
                </p>
              </div>
            </div>

            {breakdownLoading ? (
              // Basis just changed: the old per-requirement numbers describe the
              // previous basis, so hide them until the new ones land.
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Sk key={i} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            ) : job.requirements.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <p className="font-body text-sm text-on-surface-variant">
                  Perusahaan belum menambahkan daftar kualifikasi untuk lowongan ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {job.requirements.map((req, idx) => {
                  const b = breakdownByReq.get(req.id);
                  const contribution = b?.contribution ?? null;
                  const sim = b ? Math.round(b.similarity * 100) : null;
                  const isOpen = openReqs.has(req.id);
                  const hasClo = !!b?.clo_code;
                  // The grade that actually produced `contribution`, per basis.
                  const effGrade =
                    gradeBasis === "course" ? b?.course_grade ?? null : b?.grade ?? null;
                  return (
                    <div
                      key={req.id}
                      className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden"
                    >
                      {/* Requirement header — click to toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenReqs((prev) => {
                            const next = new Set(prev);
                            if (next.has(req.id)) next.delete(req.id);
                            else next.add(req.id);
                            return next;
                          })
                        }
                        aria-expanded={isOpen}
                        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-surface-container-high/50 transition-colors"
                      >
                        <span className="font-label text-xs text-on-surface-variant shrink-0">{idx + 1}.</span>
                        <span className="flex-1 min-w-0 font-body text-sm font-semibold text-on-background">
                          {req.req_text}
                        </span>
                        <span className={`font-label text-xs font-bold px-2 py-0.5 rounded bg-surface-container shrink-0 ${scoreColor(contribution)}`}>
                          {contribution != null ? `${contribution}%` : "—"}
                        </span>
                        <Icon
                          name="expand_more"
                          size={20}
                          className={`text-on-surface-variant shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Expanded detail — table of the matched CLO */}
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1">
                          {hasClo ? (
                            <table className="w-full border-collapse text-sm table-fixed">
                              <thead>
                                <tr className="border-b-2 border-outline-variant/40">
                                  <th className="w-[18%] text-left font-label text-xs font-bold text-on-surface-variant px-3 py-2">Matkul</th>
                                  <th className="w-[4.5rem] text-center font-label text-xs font-bold text-on-surface-variant px-3 py-2">
                                    {gradeBasis === "course" ? "Nilai MK" : "Nilai CLO"}
                                  </th>
                                  <th className="text-left font-label text-xs font-bold text-on-surface-variant px-3 py-2">CLO</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="align-top">
                                  <td className="px-3 py-2.5 font-label text-xs text-on-surface">
                                    {b!.matkul_nama ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-label text-sm font-semibold text-on-surface">
                                    {effGrade ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5 font-body text-sm text-on-surface leading-relaxed">
                                    <span className="font-semibold text-primary">{b!.clo_code}</span>
                                    {" — "}
                                    {b!.clo_text ?? "Teks CLO tidak tersedia."}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <p className="px-3 font-body text-xs text-on-surface-variant italic">
                              Tidak ada CLO yang relevan untuk kualifikasi ini.
                            </p>
                          )}
                          {sim != null && (
                            <p className="px-3 mt-2 font-label text-[11px] text-on-surface-variant">
                              Kemiripan {sim}% ×{" "}
                              {gradeBasis === "course" ? "nilai MK" : "nilai CLO"}{" "}
                              {effGrade ?? 0} ={" "}
                              <span className={`font-bold ${scoreColor(contribution)}`}>
                                {contribution ?? 0}% kontribusi
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
