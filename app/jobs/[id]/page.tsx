"use client";

import React, { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import TopBar from "@/components/layout/TopBar";

/* ── Student CLO Data ── */
const studentCLOs = [
  { code: "CLO1", description: "Mampu membuat REST API menggunakan framework modern", grade: "A", weight: 1.0 },
  { code: "CLO2", description: "Mampu merancang dan mengimplementasikan database SQL", grade: "B", weight: 0.7 },
  { code: "CLO3", description: "Mampu membuat aplikasi Android menggunakan Kotlin", grade: "C", weight: 0.4 },
];

/* ── Job Data ── */
const jobDetail = {
  title: "Frontend Developer",
  company: "Tokopedia",
  location: "Jakarta, Indonesia",
  type: "Full-time",
  salary: "Rp 10–18 jt/bulan",
  deadline: "30 Mei 2026",
  posted: "10 Mei 2026",
  description:
    "Kami mencari Frontend Developer untuk membangun dan memelihara aplikasi web berskala besar. Kandidat akan bekerja dalam tim cross-functional menggunakan teknologi modern.",
  responsibilities: [
    "Mengembangkan fitur frontend menggunakan React dan TypeScript",
    "Berkolaborasi dengan tim backend untuk integrasi REST API",
    "Menulis kode yang bersih, terstruktur, dan terdokumentasi",
    "Melakukan code review dan mentoring junior developer",
    "Optimasi performa dan aksesibilitas aplikasi web",
  ],
  requirements: [
    {
      code: "Req A",
      description: "Menguasai REST API dan Laravel",
      similarities: [
        { clo: "CLO1", sim: 0.91, weightedScore: 0.91 * 1.0 },
        { clo: "CLO2", sim: 0.35, weightedScore: 0.35 * 0.7 },
        { clo: "CLO3", sim: 0.15, weightedScore: 0.15 * 0.4 },
      ],
    },
    {
      code: "Req B",
      description: "Menguasai MySQL dan PostgreSQL",
      similarities: [
        { clo: "CLO1", sim: 0.38, weightedScore: 0.38 * 1.0 },
        { clo: "CLO2", sim: 0.89, weightedScore: 0.89 * 0.7 },
        { clo: "CLO3", sim: 0.12, weightedScore: 0.12 * 0.4 },
      ],
    },
    {
      code: "Req C",
      description: "Pengalaman React.js frontend",
      similarities: [
        { clo: "CLO1", sim: 0.31, weightedScore: 0.31 * 1.0 },
        { clo: "CLO2", sim: 0.28, weightedScore: 0.28 * 0.7 },
        { clo: "CLO3", sim: 0.22, weightedScore: 0.22 * 0.4 },
      ],
    },
    {
      code: "Req D",
      description: "Memahami Docker dan Kubernetes",
      similarities: [
        { clo: "CLO1", sim: 0.18, weightedScore: 0.18 * 1.0 },
        { clo: "CLO2", sim: 0.14, weightedScore: 0.14 * 0.7 },
        { clo: "CLO3", sim: 0.11, weightedScore: 0.11 * 0.4 },
      ],
    },
  ],
};

/* ── Helpers ── */
function getReqScore(req: (typeof jobDetail.requirements)[0]) {
  return Math.max(...req.similarities.map((s) => s.weightedScore));
}

function getBestCLO(req: (typeof jobDetail.requirements)[0]) {
  return req.similarities.reduce((a, b) => (b.weightedScore > a.weightedScore ? b : a));
}

function getStatus(score: number) {
  if (score >= 0.7) return { icon: "check_circle", color: "text-green-700", label: "Terpenuhi", bg: "bg-green-50", bar: "bg-green-500" };
  if (score >= 0.4) return { icon: "warning", color: "text-tertiary", label: "Parsial", bg: "bg-tertiary-fixed", bar: "bg-yellow-400" };
  return { icon: "cancel", color: "text-error", label: "Gap", bg: "bg-red-50", bar: "bg-red-400" };
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "bg-green-50 text-green-700";
  if (grade.startsWith("B")) return "bg-blue-50 text-blue-700";
  return "bg-tertiary-fixed text-on-tertiary-container";
}

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? "#2e7d32" : pct >= 40 ? "#f59e0b" : "#dc2626";

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-headline text-2xl font-bold text-on-background">{pct}%</p>
        <p className="font-label text-[10px] text-on-surface-variant">match</p>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "analysis">("overview");

  const reqScores = jobDetail.requirements.map(getReqScore);
  const overallScore = reqScores.reduce((a, b) => a + b, 0) / reqScores.length;

  const metCount     = reqScores.filter((s) => s >= 0.7).length;
  const partialCount = reqScores.filter((s) => s >= 0.4 && s < 0.7).length;
  const gapCount     = reqScores.filter((s) => s < 0.4).length;

  const gapReqs = jobDetail.requirements.filter((r) => getReqScore(r) < 0.7);

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
                <Icon name="code" className="text-primary" size={28} />
              </div>
              <div>
                <h1 className="font-headline text-2xl font-bold text-on-background">{jobDetail.title}</h1>
                <p className="font-body text-on-surface-variant">{jobDetail.company}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { icon: "location_on", text: jobDetail.location },
                    { icon: "work",        text: jobDetail.type },
                    { icon: "payments",    text: jobDetail.salary },
                    { icon: "event",       text: `Deadline: ${jobDetail.deadline}` },
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
              <ScoreRing score={overallScore} />
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
            {/* Left: Description + Responsibilities */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-xl font-bold text-on-background mb-3">Deskripsi</h2>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">{jobDetail.description}</p>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-xl font-bold text-on-background mb-4">Tanggung Jawab</h2>
                <ul className="space-y-3">
                  {jobDetail.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icon name="check_circle" className="text-primary mt-0.5 shrink-0" size={18} />
                      <span className="font-body text-sm text-on-surface-variant">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Match Summary */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-lg font-bold text-on-background mb-4">Ringkasan Kecocokan</h2>
                <div className="space-y-3">
                  {[
                    { icon: "check_circle", label: "Terpenuhi",   count: metCount,     color: "text-green-700" },
                    { icon: "warning",      label: "Parsial",     count: partialCount, color: "text-tertiary"  },
                    { icon: "cancel",       label: "Perlu Upskill", count: gapCount,   color: "text-error"     },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-2 font-label text-sm ${item.color}`}>
                        <Icon name={item.icon} size={16} /> {item.label}
                      </span>
                      <span className={`font-label text-sm font-bold ${item.color}`}>
                        {item.count} / {jobDetail.requirements.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upskilling Suggestions */}
              {gapReqs.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                  <h2 className="font-headline text-lg font-bold text-on-background mb-3">Rekomendasi Upskill</h2>
                  <div className="space-y-3">
                    {gapReqs.map((r) => {
                      const score = getReqScore(r);
                      const s = getStatus(score);
                      return (
                        <div key={r.code} className={`p-3 rounded-xl ${score < 0.4 ? "bg-error-container/30" : "bg-tertiary-fixed/30"}`}>
                          <p className={`font-label text-xs font-bold mb-0.5 ${s.color}`}>{s.label}</p>
                          <p className="font-body text-xs text-on-surface-variant">
                            {r.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Per-Requirement Analysis */}
            <div className="lg:col-span-2 space-y-4">
              {jobDetail.requirements.map((req) => {
                const score   = getReqScore(req);
                const best    = getBestCLO(req);
                const status  = getStatus(score);
                const cloInfo = studentCLOs.find((c) => c.code === best.clo);

                return (
                  <div key={req.code} className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
                    <div className="flex items-start gap-4">
                      {/* Status icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${status.bg}`}>
                        <Icon name={status.icon} className={status.color} size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="font-body text-sm font-semibold text-on-background">{req.description}</p>
                          <span className={`font-label text-xs font-bold px-2 py-0.5 rounded ${status.bg} ${status.color} shrink-0`}>
                            {status.label}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-surface-container rounded-full mt-2 mb-3">
                          <div
                            className={`h-full rounded-full transition-all ${status.bar}`}
                            style={{ width: `${Math.round(score * 100)}%` }}
                          />
                        </div>

                        {/* Matched competency */}
                        {score >= 0.4 && cloInfo ? (
                          <div className="flex items-center gap-2">
                            <Icon name="school" size={14} className="text-on-surface-variant shrink-0" />
                            <p className="font-body text-xs text-on-surface-variant">
                              {score >= 0.7 ? "Kompetensi terkuat" : "Kompetensi terdekat"}:{" "}
                              <span className="font-semibold text-on-background">{cloInfo.description}</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded font-label text-[10px] font-bold ${gradeColor(cloInfo.grade)}`}>
                                {cloInfo.grade}
                              </span>
                            </p>
                          </div>
                        ) : score < 0.4 ? (
                          <div className="flex items-center gap-2">
                            <Icon name="school" size={14} className="text-error shrink-0" />
                            <p className="font-body text-xs text-on-surface-variant">
                              Belum ada kompetensi yang relevan untuk kualifikasi ini
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Student Competency Profile */}
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
                <h2 className="font-headline text-lg font-bold text-on-background mb-4">Kompetensi Kamu</h2>
                <div className="space-y-3">
                  {studentCLOs.map((clo) => (
                    <div key={clo.code} className="p-3 rounded-xl bg-surface-container-low">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-label text-xs font-bold text-primary">{clo.code}</span>
                        <span className={`px-2 py-0.5 rounded font-label text-xs font-bold ${gradeColor(clo.grade)}`}>
                          Nilai {clo.grade}
                        </span>
                      </div>
                      <p className="font-body text-xs text-on-surface-variant">{clo.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-fixed/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" className="text-primary mt-0.5 shrink-0" size={18} />
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    Analisis ini didasarkan pada kesesuaian kompetensi akademikmu dengan kebutuhan posisi, diperhitungkan bersama pencapaian nilaimu.
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