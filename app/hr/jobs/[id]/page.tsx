"use client";

import Icon from "@/components/ui/Icon";
import { type JobStatus, type JobWithSkills } from "@/lib/supabase/hr-queries";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHRData } from "../../HRDataProvider";

const jobStatusLabel: Record<JobStatus, string> = {
  processing: "Diproses",
  active: "Aktif",
  closing: "Segera Tutup",
  closed: "Ditutup",
  draft: "Draft",
};

const jobStatusColor: Record<JobStatus, string> = {
  processing: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  closing: "bg-amber-50 text-amber-700",
  closed: "bg-surface-container text-on-surface-variant",
  draft: "bg-tertiary-fixed text-on-tertiary-container",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container rounded-md ${className ?? ""}`} />;
}

export default function HRJobDetailPage() {
  const params = useParams<{ id: string }>();
  const { jobs, applications, loading } = useHRData();

  const job: JobWithSkills | undefined = jobs.find((j) => j.id === params.id);
  const applicantCount = applications.filter((a) => a.job_id === params.id).length;

  if (loading && !job) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Sk className="h-5 w-48" />
          <Sk className="h-9 w-24 rounded-lg" />
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border space-y-4">
          <div className="flex items-center gap-4">
            <Sk className="w-14 h-14 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Sk className="h-7 w-64" />
              <Sk className="h-4 w-40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Sk className="h-6 w-24 rounded-full" />
            <Sk className="h-6 w-28 rounded-full" />
            <Sk className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-3">
          <Sk className="h-6 w-40" />
          <Sk className="h-4 w-full" />
          <Sk className="h-4 w-5/6" />
          <Sk className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Kembali ke Kelola Lowongan
        </Link>
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border text-center">
          <Icon name="search_off" size={48} className="text-on-surface-variant mb-2" />
          <h1 className="font-headline text-xl font-bold text-on-background">Lowongan tidak ditemukan</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Lowongan ini mungkin sudah dihapus.
          </p>
        </div>
      </div>
    );
  }

  const sortedRequirements = [...job.requirements].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Edit */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/hr/jobs"
          className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Kembali ke Kelola Lowongan
        </Link>
        <Link
          href={`/hr/jobs?edit=${job.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <Icon name="edit" size={16} /> Edit
        </Link>
      </div>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`font-label text-xs font-semibold px-2.5 py-0.5 rounded-full ${jobStatusColor[job.status] ?? ""}`}>
            {jobStatusLabel[job.status] ?? job.status}
          </span>
          {job.job_type && (
            <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
              {job.job_type}
            </span>
          )}
          {job.category && (
            <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
              {job.category}
            </span>
          )}
        </div>

        <h1 className="font-headline text-2xl font-bold text-on-background mb-4">{job.title}</h1>

        <div className="flex flex-wrap gap-4 text-on-surface-variant">
          {job.location && (
            <span className="inline-flex items-center gap-1.5 font-label text-sm">
              <Icon name="location_on" size={16} /> {job.location}
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1.5 font-label text-sm">
              <Icon name="payments" size={16} /> {job.salary}
            </span>
          )}
          {job.deadline && (
            <span className="inline-flex items-center gap-1.5 font-label text-sm">
              <Icon name="event" size={16} /> Deadline: {formatDate(job.deadline)}
            </span>
          )}
          {job.posted_at && (
            <span className="inline-flex items-center gap-1.5 font-label text-sm">
              <Icon name="calendar_today" size={16} /> Diposting: {formatDate(job.posted_at)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-label text-sm">
            <Icon name="group" size={16} /> {applicantCount} Pelamar
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
            <h2 className="font-headline text-lg font-bold text-on-background mb-3">Deskripsi Pekerjaan</h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {job.description?.trim() || "Belum ada deskripsi."}
            </p>
          </div>

          {/* Qualifications */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
            <h2 className="font-headline text-lg font-bold text-on-background mb-4">
              Kualifikasi / Kompetensi
            </h2>
            {sortedRequirements.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">Belum ada kualifikasi yang ditambahkan.</p>
            ) : (
              <ul className="space-y-2">
                {sortedRequirements.map((req) => (
                  <li key={req.id} className="flex items-start gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                    <Icon name="check_circle" size={17} className="text-primary shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-on-background">{req.req_text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Skills */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
            <h2 className="font-headline text-lg font-bold text-on-background mb-4">Tech Skills</h2>
            {job.job_skills.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">Belum ada skill yang ditambahkan.</p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
