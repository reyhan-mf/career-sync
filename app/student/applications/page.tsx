"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useStudentData } from "../StudentDataProvider";

const STATUS_META: Record<string, { label: string; cls: string; icon: string }> = {
  new: { label: "Baru", cls: "bg-blue-50 text-blue-700", icon: "fiber_new" },
  reviewed: {
    label: "Dalam Review",
    cls: "bg-tertiary-fixed text-on-tertiary-container",
    icon: "hourglass_top",
  },
  interview: { label: "Interview", cls: "bg-blue-50 text-blue-700", icon: "event" },
  accepted: { label: "Diterima", cls: "bg-green-50 text-green-700", icon: "check_circle" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700", icon: "cancel" },
};

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

export default function ApplicationsPage() {
  const { applications, loading, error, profile, matchScores } = useStudentData();
  const [filter, setFilter] = useState("all");

  const filteredApps = filter === "all"
    ? applications
    : applications.filter((app) => app.status === filter);

  const countByStatus = (status: string) =>
    applications.filter((a) => a.status === status).length;

  if (loading && !profile) {
    return (
      <div className="max-w-6xl mx-auto py-10 text-center font-body text-sm text-on-surface-variant">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">Lamaran Saya</h1>
        <p className="font-body text-on-surface-variant">
          Pantau status semua lamaran pekerjaan Anda.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Lamaran", value: applications.length, icon: "description", color: "text-primary", bg: "bg-primary-fixed" },
          { label: "Dalam Review", value: countByStatus("reviewed") + countByStatus("new"), icon: "hourglass_top", color: "text-tertiary", bg: "bg-tertiary-fixed" },
          { label: "Interview", value: countByStatus("interview"), icon: "event", color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Diterima", value: countByStatus("accepted"), icon: "check_circle", color: "text-green-700", bg: "bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon name={stat.icon} className={stat.color} size={20} />
            </div>
            <p className="font-label text-xs text-on-surface-variant">{stat.label}</p>
            <p className="font-headline text-xl font-bold text-on-background">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "Semua" },
          { key: "new", label: "Baru" },
          { key: "reviewed", label: "Dalam Review" },
          { key: "interview", label: "Interview" },
          { key: "accepted", label: "Diterima" },
          { key: "rejected", label: "Ditolak" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl font-label text-sm whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high ghost-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="inbox" size={48} className="text-outline mx-auto mb-4" />
            <p className="font-headline text-lg text-on-surface-variant">
              {applications.length === 0
                ? "Anda belum mengirim lamaran pekerjaan."
                : "Tidak ada lamaran pada kategori ini."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                <TableHead>Posisi</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Tanggal Lamar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map((app) => {
                const meta = STATUS_META[app.status] ?? {
                  label: app.status,
                  cls: "bg-surface-container text-on-surface-variant",
                  icon: "help",
                };
                // Prefer the live match score (same source as Job Matching);
                // fall back to the value stored at apply time for jobs no longer
                // active. Older rows saved before scoring worked have a null
                // stored value, so the live score is what keeps this accurate.
                const score =
                  app.job_id && matchScores[app.job_id] != null
                    ? matchScores[app.job_id]
                    : app.match_score;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <span className="font-body text-sm font-medium text-on-background">
                        {app.jobs?.title ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-label text-sm font-bold text-primary">
                        {score != null ? `${score}%` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-label text-sm text-on-surface-variant">
                        {formatDate(app.applied_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-xs font-semibold ${meta.cls}`}>
                        <Icon name={meta.icon} size={14} />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {app.job_id ? (
                        <Link
                          href={`/student/jobs/${app.job_id}`}
                          aria-label="Lihat detail lowongan"
                          className="inline-flex p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                          <Icon name="visibility" size={18} />
                        </Link>
                      ) : (
                        <span className="inline-flex p-2 text-outline">
                          <Icon name="visibility_off" size={18} />
                        </span>
                      )}
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
