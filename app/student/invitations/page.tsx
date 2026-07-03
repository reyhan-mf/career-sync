"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, StatGridSkeleton } from "@/components/ui/Skeletons";
import { useStudentData } from "../StudentDataProvider";
import { studentDataMutators } from "@/lib/supabase/studentDataStore";
import {
  respondToInvitation,
  type StudentInvitation,
} from "@/lib/supabase/invitation-queries";
import { reportStudentError } from "@/lib/supabase/studentErrors";

const STATUS_META: Record<string, { label: string; cls: string; icon: string }> = {
  invited: { label: "Menunggu Respons", cls: "bg-primary-fixed text-primary", icon: "hourglass_top" },
  responded: { label: "Diterima", cls: "bg-green-50 text-green-700", icon: "check_circle" },
  declined: { label: "Ditolak", cls: "bg-red-50 text-red-700", icon: "cancel" },
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

export default function InvitationsPage() {
  const { invitations, loading, error, profile } = useStudentData();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = filter === "all"
    ? invitations
    : invitations.filter((i) => i.status === filter);

  const countByStatus = (status: string) =>
    invitations.filter((i) => i.status === status).length;

  async function respond(inv: StudentInvitation, accept: boolean) {
    if (busyId) return;
    setBusyId(inv.id);
    setActionError(null);
    try {
      const updated = await respondToInvitation(inv.id, accept);
      studentDataMutators.setInvitations((prev) =>
        prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)),
      );
    } catch (e) {
      setActionError(reportStudentError(e, "invitations.respond"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !profile) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <StatGridSkeleton />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">Undangan Talent</h1>
        <p className="font-body text-on-surface-variant">
          Perusahaan yang tertarik dengan kompetensi Anda mengundang Anda untuk melamar.
        </p>
      </div>

      {(error || actionError) && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
          {actionError ?? error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Undangan", value: invitations.length, icon: "forward_to_inbox", color: "text-primary", bg: "bg-primary-fixed" },
          { label: "Menunggu Respons", value: countByStatus("invited"), icon: "hourglass_top", color: "text-tertiary", bg: "bg-tertiary-fixed" },
          { label: "Diterima", value: countByStatus("responded"), icon: "check_circle", color: "text-green-700", bg: "bg-green-50" },
          { label: "Ditolak", value: countByStatus("declined"), icon: "cancel", color: "text-red-700", bg: "bg-red-50" },
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
          { key: "invited", label: "Menunggu Respons" },
          { key: "responded", label: "Diterima" },
          { key: "declined", label: "Ditolak" },
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

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border py-16 text-center">
          <Icon name="mark_email_unread" size={48} className="text-outline mx-auto mb-4" />
          <p className="font-headline text-lg text-on-surface-variant">
            {invitations.length === 0
              ? "Belum ada undangan dari perusahaan."
              : "Tidak ada undangan pada kategori ini."}
          </p>
          {invitations.length === 0 && (
            <p className="font-body text-sm text-outline mt-2">
              Tingkatkan nilai kompetensi Anda agar lebih menarik bagi perekrut.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => {
            const meta = STATUS_META[inv.status] ?? {
              label: inv.status,
              cls: "bg-surface-container text-on-surface-variant",
              icon: "help",
            };
            const company = inv.jobs?.company?.name ?? "Perusahaan";
            const isBusy = busyId === inv.id;
            return (
              <div
                key={inv.id}
                className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                      <Icon name={inv.jobs?.company?.logo_icon || "business"} className="text-primary" size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-headline text-lg font-bold text-on-background truncate">
                        {inv.jobs?.title ?? "Lowongan tidak tersedia"}
                      </h3>
                      <p className="font-body text-sm text-on-surface-variant">{company}</p>
                      <div className="flex flex-wrap gap-3 mt-2 font-label text-xs text-on-surface-variant">
                        {inv.jobs?.location && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="location_on" size={14} /> {inv.jobs.location}
                          </span>
                        )}
                        {inv.jobs?.job_type && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="work" size={14} /> {inv.jobs.job_type}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Icon name="schedule" size={14} /> Diundang {formatDate(inv.sent_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-xs font-semibold shrink-0 ${meta.cls}`}>
                    <Icon name={meta.icon} size={14} />
                    {meta.label}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-outline-variant/20 flex-wrap">
                  {inv.job_id && (
                    <Link
                      href={`/student/jobs/${inv.job_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline/30 font-label text-sm font-semibold text-on-background hover:bg-surface-container transition-colors"
                    >
                      <Icon name="visibility" size={16} /> Lihat Lowongan
                    </Link>
                  )}
                  {inv.status === "invited" && (
                    <>
                      <button
                        type="button"
                        onClick={() => respond(inv, false)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-error/40 font-label text-sm font-semibold text-error hover:bg-error-container/40 transition-colors disabled:opacity-50"
                      >
                        <Icon name="close" size={16} /> Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => respond(inv, true)}
                        disabled={isBusy}
                        className="btn-gradient inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-label text-sm font-bold disabled:opacity-50"
                      >
                        <Icon name={isBusy ? "progress_activity" : "check"} size={16} className={isBusy ? "animate-spin" : ""} />
                        {isBusy ? "Memproses…" : "Terima Undangan"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
