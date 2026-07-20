"use client";

import CompetencyInsight from "@/components/hr/CompetencyInsight";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRowsSkeleton } from "@/components/ui/Skeletons";
import {
  gradesByCloId,
  matchScoreFromRbc,
  rbcByJobId,
} from "@/lib/hr-match";
import {
  inviteStatusColor,
  inviteStatusLabel,
  jobStatusColor,
  jobStatusLabel,
  matchColorClass,
  type InviteStatus,
  type JobStatus,
} from "@/lib/hr-mock";
import {
  cancelInvitation,
  inviteTalent,
  type TalentCLOGrade,
  type TalentInvitation,
  type TalentStudent,
} from "@/lib/supabase/hr-queries";
import { hrDataMutators } from "@/lib/supabase/hrDataStore";
import { reportHrError } from "@/lib/supabase/hrErrors";
import {
  getJobMatchBreakdown,
  type ReqMatchBreakdown,
} from "@/lib/supabase/student-queries";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHRData } from "../../HRDataProvider";

interface TalentRow {
  talent: TalentStudent;
  grades: TalentCLOGrade[];
  matchScore: number;
  invite: TalentInvitation | null;
  uiStatus: InviteStatus;
  prodiName: string;
}

export default function JobTalentPoolPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;

  const {
    hr,
    jobs,
    talents,
    talentGrades,
    reqBestClos,
    invitations,
    prodiNames,
    loading,
    error,
  } = useHRData();

  const job = useMemo(
    () => jobs.find((j) => j.id === jobId) ?? null,
    [jobs, jobId],
  );

  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("all");
  const [inviteFilter, setInviteFilter] = useState("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Row-level "batalkan undangan" — confirmed before it fires.
  const [cancelTarget, setCancelTarget] = useState<TalentRow | null>(null);

  // Per-requirement CLO breakdown for a talent vs THIS job — same RPC the student
  // job-detail page uses (student_job_match_breakdown). Cached per talent (the
  // job is fixed on this page) so re-opening a talent is instant, and the visible
  // talents are prefetched below.
  type BreakdownEntry = {
    rows: ReqMatchBreakdown[];
    status: "ready" | "error";
  };
  const [breakdownCache, setBreakdownCache] = useState<
    Map<string, BreakdownEntry>
  >(new Map());
  const inFlight = useRef<Set<string>>(new Set());

  const fetchBreakdown = useCallback(
    (talentId: string) => {
      if (inFlight.current.has(talentId)) return;
      inFlight.current.add(talentId);
      getJobMatchBreakdown(talentId, jobId)
        .then((rows) =>
          setBreakdownCache((prev) =>
            new Map(prev).set(talentId, { rows, status: "ready" }),
          ),
        )
        .catch(() =>
          setBreakdownCache((prev) =>
            new Map(prev).set(talentId, { rows: [], status: "error" }),
          ),
        )
        .finally(() => inFlight.current.delete(talentId));
    },
    [jobId],
  );

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, TalentCLOGrade[]>();
    talentGrades.forEach((g) => {
      const list = map.get(g.student_id) ?? [];
      list.push(g);
      map.set(g.student_id, list);
    });
    return map;
  }, [talentGrades]);

  // requirement→best-CLO rows for THIS job only. Empty when the job has no
  // embedded requirements yet — matching is impossible until qualifications exist.
  const rbcForJob = useMemo(
    () => rbcByJobId(reqBestClos).get(jobId) ?? [],
    [reqBestClos, jobId],
  );
  const jobHasRequirements = rbcForJob.length > 0;

  // Invitations scoped to THIS job — a student invited to another job still shows
  // as "not contacted" here, so the status reflects this specific pool.
  const inviteByStudent = useMemo(() => {
    const map = new Map<string, TalentInvitation>();
    invitations.forEach((i) => {
      if (i.student_id && i.job_id === jobId) map.set(i.student_id, i);
    });
    return map;
  }, [invitations, jobId]);

  const rows = useMemo<TalentRow[]>(() => {
    return talents.map((t) => {
      const grades = gradesByStudent.get(t.id) ?? [];
      const score = matchScoreFromRbc(gradesByCloId(grades), rbcForJob) ?? 0;
      const invite = inviteByStudent.get(t.id) ?? null;
      const uiStatus: InviteStatus = invite ? invite.status : "not_contacted";
      return {
        talent: t,
        grades,
        matchScore: score,
        invite,
        uiStatus,
        prodiName: t.prodi_id ? (prodiNames[t.prodi_id] ?? "—") : "—",
      };
    });
  }, [talents, gradesByStudent, rbcForJob, inviteByStudent, prodiNames]);

  const prodiOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.prodiName && r.prodiName !== "—") set.add(r.prodiName);
    });
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter((r) => {
        const matchesSearch =
          !q ||
          r.talent.name.toLowerCase().includes(q) ||
          r.talent.nim.toLowerCase().includes(q) ||
          r.prodiName.toLowerCase().includes(q);
        const matchesProdi =
          prodiFilter === "all" || r.prodiName === prodiFilter;
        const matchesInvite =
          inviteFilter === "all" || r.uiStatus === inviteFilter;
        return matchesSearch && matchesProdi && matchesInvite;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [rows, search, prodiFilter, inviteFilter]);

  const total = rows.length;
  const strongCount = rows.filter((r) => r.matchScore >= 85).length;
  const invitedCount = rows.filter((r) => r.uiStatus === "invited").length;
  const respondedCount = rows.filter((r) => r.uiStatus === "responded").length;

  const activeFilterCount = [
    prodiFilter !== "all",
    inviteFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setProdiFilter("all");
    setInviteFilter("all");
  };

  const selected =
    filtered.find((r) => r.talent.id === selectedId) ??
    rows.find((r) => r.talent.id === selectedId) ??
    null;

  const insightTalentId = selected?.talent.id ?? null;

  // Fetch the open talent's CLO breakdown if not cached. Reuses the student-side
  // RPC so the numbers match /student/jobs/[id].
  useEffect(() => {
    if (!insightTalentId || !jobHasRequirements) return;
    if (breakdownCache.has(insightTalentId)) return;
    fetchBreakdown(insightTalentId);
  }, [insightTalentId, jobHasRequirements, breakdownCache, fetchBreakdown]);

  // Background-prefetch breakdowns for the visible (filtered, score-sorted)
  // talents so opening any of them is instant. Capped so a large pool doesn't
  // fire hundreds of RPCs at once.
  useEffect(() => {
    if (!jobHasRequirements) return;
    filtered.slice(0, 25).forEach((r) => {
      if (!breakdownCache.has(r.talent.id)) fetchBreakdown(r.talent.id);
    });
  }, [filtered, jobHasRequirements, breakdownCache, fetchBreakdown]);

  const currentEntry = insightTalentId
    ? breakdownCache.get(insightTalentId)
    : undefined;
  const breakdown = currentEntry?.status === "ready" ? currentEntry.rows : [];
  const breakdownLoading =
    jobHasRequirements && !!insightTalentId && !currentEntry;
  const breakdownError = currentEntry?.status === "error";

  const openTalent = (row: TalentRow) => {
    setSelectedId(row.talent.id);
    setActionError(null);
  };

  const closeTalent = () => {
    setSelectedId(null);
    setActionError(null);
  };

  const canInvite =
    !!job && (job.status === "active" || job.status === "closing");

  const handleInvite = async () => {
    if (!selected || !hr || !job) return;
    setBusy(true);
    setActionError(null);
    try {
      const inv = await inviteTalent(hr.id, selected.talent.id, job.id);
      hrDataMutators.setInvitations((prev) => {
        const without = prev.filter((p) => p.id !== inv.id);
        return [...without, inv];
      });
    } catch (e) {
      setActionError(reportHrError(e, "jobTalentPool.invite"));
    } finally {
      setBusy(false);
    }
  };

  const cancelInvite = async (invitationId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await cancelInvitation(invitationId);
      hrDataMutators.setInvitations((prev) =>
        prev.filter((p) => p.id !== invitationId),
      );
      setCancelTarget(null);
    } catch (e) {
      setActionError(reportHrError(e, "jobTalentPool.cancelInvite"));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!selected?.invite) return;
    await cancelInvite(selected.invite.id);
  };

  // ─── Loading / not-found guards ───────────────────────────────────────────
  if (loading && !job) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border space-y-2"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <table className="w-full">
            <tbody>
              <TableRowsSkeleton rows={6} cols={6} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/hr/talent-pool"
          className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Kembali ke Talent Pool
        </Link>
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-ambient ghost-border text-center">
          <Icon
            name="search_off"
            size={48}
            className="text-on-surface-variant mb-2"
          />
          <h1 className="font-headline text-xl font-bold text-on-background">
            Lowongan tidak ditemukan
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Lowongan ini mungkin sudah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!cancelTarget}
        title="Batalkan Undangan?"
        description={
          <>
            Undangan untuk{" "}
            <span className="font-bold text-on-background">
              {cancelTarget?.talent.name}
            </span>{" "}
            pada lowongan {job.title} akan ditarik kembali. Anda bisa mengundangnya lagi
            kapan saja.
          </>
        }
        confirmLabel="Batalkan Undangan"
        cancelLabel="Kembali"
        loading={busy}
        onConfirm={() => cancelTarget?.invite && cancelInvite(cancelTarget.invite.id)}
        onCancel={() => setCancelTarget(null)}
      />

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeTalent}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/30 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-tertiary-fixed rounded-full flex items-center justify-center">
                  <Icon
                    name="auto_awesome"
                    className="text-tertiary"
                    size={28}
                    filled
                  />
                </div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-background">
                    {selected.talent.name}
                  </h2>
                  <p className="font-body text-sm text-on-surface-variant">
                    NIM {selected.talent.nim} · {selected.prodiName}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(selected.matchScore)}`}
                    >
                      {selected.matchScore}% match
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${inviteStatusColor[selected.uiStatus]}`}
                    >
                      {inviteStatusLabel[selected.uiStatus]}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTalent}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors shrink-0"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {actionError && (
                <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Detail icon="badge" label="NIM" value={selected.talent.nim} />
                <Detail
                  icon="event"
                  label="Angkatan"
                  value={selected.talent.angkatan?.toString() ?? "—"}
                />
                <Detail
                  icon="school"
                  label="Program Studi"
                  value={selected.prodiName}
                />
                <Detail
                  icon="mail"
                  label="Email"
                  value={selected.talent.email ?? "—"}
                />
                <Detail icon="work" label="Lowongan" value={job.title} />
                <Detail
                  icon="bolt"
                  label="Status"
                  value={selected.talent.status}
                />
              </div>

              <CompetencyInsight
                key={selected.talent.id}
                jobTitle={job.title}
                breakdown={breakdown}
                loading={breakdownLoading}
                error={breakdownError}
              />

              {selected.uiStatus === "not_contacted" && canInvite && (
                <div className="p-4 rounded-xl bg-primary-fixed/40 border border-primary/20 space-y-1">
                  <p className="font-label text-sm font-semibold text-primary">
                    Undang kandidat ini untuk melamar:
                  </p>
                  <p className="font-body text-sm text-on-background">
                    {job.title}
                  </p>
                </div>
              )}

              {selected.uiStatus === "not_contacted" && !canInvite && (
                <div className="p-4 rounded-xl bg-surface-container-low text-center">
                  <p className="font-body text-sm text-on-surface-variant">
                    Lowongan ini tidak aktif, jadi kandidat belum bisa diundang.{" "}
                    <Link
                      href={`/hr/jobs?edit=${job.id}`}
                      className="text-primary hover:underline"
                    >
                      Aktifkan lowongan
                    </Link>{" "}
                    terlebih dahulu.
                  </p>
                </div>
              )}

              {selected.uiStatus !== "not_contacted" && (
                <div className="p-4 rounded-xl bg-surface-container-low">
                  <p className="font-label text-sm font-semibold text-on-background mb-1">
                    Status undangan: {inviteStatusLabel[selected.uiStatus]}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    {selected.uiStatus === "invited" &&
                      "Undangan telah dikirim. Menunggu respon dari kandidat."}
                    {selected.uiStatus === "responded" &&
                      "Kandidat telah merespon undangan Anda."}
                    {selected.uiStatus === "declined" &&
                      "Kandidat menolak undangan Anda."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={closeTalent}
                className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
              {selected.uiStatus === "not_contacted" ? (
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={busy || !canInvite}
                  className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Icon name="send" size={18} />
                  {busy ? "Mengirim..." : "Kirim Undangan"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelInvite}
                  disabled={busy}
                  className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label font-semibold transition-colors disabled:opacity-60"
                >
                  {busy ? "Membatalkan..." : "Batalkan Undangan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/hr/talent-pool"
          className="inline-flex items-center gap-2 font-label text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Kembali ke Talent Pool
        </Link>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-full font-label text-xs font-semibold text-tertiary">
              <Icon name="auto_awesome" size={14} filled />
              Talent Pool per Lowongan
            </div>
            <span
              className={`font-label text-xs font-semibold px-2.5 py-0.5 rounded-full ${jobStatusColor[job.status as JobStatus] ?? ""}`}
            >
              {jobStatusLabel[job.status as JobStatus] ?? job.status}
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-background">
            {job.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-on-surface-variant">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 font-label text-sm">
                <Icon name="location_on" size={16} /> {job.location}
              </span>
            )}
            {job.job_type && (
              <span className="inline-flex items-center gap-1.5 font-label text-sm">
                <Icon name="schedule" size={16} /> {job.job_type}
              </span>
            )}
            <Link
              href={`/hr/jobs/${job.id}`}
              className="inline-flex items-center gap-1.5 font-label text-sm text-primary hover:underline"
            >
              <Icon name="open_in_new" size={16} /> Lihat detail lowongan
            </Link>
          </div>
          <p className="font-body text-on-surface-variant max-w-2xl">
            Mahasiswa aktif diurutkan berdasarkan skor kecocokan dengan
            kualifikasi lowongan ini. Untuk pelamar aktif, lihat{" "}
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

        {!jobHasRequirements ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-ambient ghost-border">
            <Icon
              name="rule"
              size={40}
              className="text-on-surface-variant mx-auto mb-3"
            />
            <h2 className="font-headline text-lg font-bold text-on-background">
              Belum ada kualifikasi
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-1 max-w-md mx-auto">
              Talent pool dihitung dari kualifikasi/kompetensi lowongan.
              Tambahkan kualifikasi pada lowongan ini agar sistem dapat
              mencocokkan kandidat.
            </p>
            <Link
              href={`/hr/jobs?edit=${job.id}`}
              className="inline-flex items-center gap-2 mt-4 btn-gradient font-label font-bold rounded-xl px-5 py-2.5"
            >
              <Icon name="edit" size={18} /> Tambah Kualifikasi
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Total Talent" value={total} tone="tertiary" />
              <StatBox label="Match ≥85%" value={strongCount} tone="green" />
              <StatBox label="Diundang" value={invitedCount} tone="primary" />
              <StatBox label="Merespon" value={respondedCount} tone="green" />
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border space-y-3">
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Cari nama, NIM, atau program studi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={prodiFilter} onValueChange={setProdiFilter}>
                  <SelectTrigger className="h-12 w-full">
                    <Icon
                      name="school"
                      size={16}
                      className="text-on-surface-variant"
                    />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Prodi</SelectItem>
                    {prodiOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={inviteFilter} onValueChange={setInviteFilter}>
                  <SelectTrigger className="h-12 w-full">
                    <Icon
                      name="forward_to_inbox"
                      size={16}
                      className="text-on-surface-variant"
                    />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Undangan</SelectItem>
                    <SelectItem value="not_contacted">
                      Belum Diundang
                    </SelectItem>
                    <SelectItem value="invited">Diundang</SelectItem>
                    <SelectItem value="responded">Merespon</SelectItem>
                    <SelectItem value="declined">Menolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <p className="font-label text-xs text-on-surface-variant">
                    {activeFilterCount} filter aktif · {filtered.length} dari{" "}
                    {rows.length} talent
                  </p>
                  <button
                    onClick={resetFilters}
                    className="font-label text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="close" size={14} />
                    Reset filter
                  </button>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
              <div className="w-full">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[12%]" />
                    <col className="w-[30%]" />
                    <col className="w-[23%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-surface-container-low">
                      {["Talent", "Match", "Undangan", "Aksi"].map((h) => (
                        <th
                          key={h}
                          className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-3 ${h === "Aksi" ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && filtered.length === 0 ? (
                      <TableRowsSkeleton rows={6} cols={4} />
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.talent.id}
                          className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-tertiary-fixed rounded-full flex items-center justify-center shrink-0">
                                <Icon
                                  name="auto_awesome"
                                  className="text-tertiary"
                                  size={16}
                                  filled
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-body text-sm font-semibold text-on-background truncate">
                                  {r.talent.name}
                                </p>
                                <p className="font-label text-xs text-on-surface-variant truncate">
                                  NIM {r.talent.nim} · {r.prodiName}
                                </p>
                                <p className="font-label text-xs text-on-surface-variant mt-0.5">
                                  Angkatan {r.talent.angkatan ?? "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(r.matchScore)}`}
                            >
                              {r.matchScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${inviteStatusColor[r.uiStatus]}`}
                            >
                              {inviteStatusLabel[r.uiStatus]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openTalent(r)}
                                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                                title="Lihat detail"
                              >
                                <Icon name="visibility" size={18} />
                              </button>
                              {r.uiStatus === "not_contacted" && canInvite && (
                                <button
                                  onClick={() => openTalent(r)}
                                  className="p-2 text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                                  aria-label="Undang kandidat"
                                >
                                  <Icon name="send" size={18} />
                                </button>
                              )}
                              {r.invite && (
                                <button
                                  onClick={() => setCancelTarget(r)}
                                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                                  title="Batalkan undangan"
                                  aria-label="Batalkan undangan"
                                >
                                  <Icon name="person_remove" size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr className="border-t border-surface-variant">
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                        >
                          {rows.length === 0
                            ? "Belum ada mahasiswa aktif di sistem."
                            : "Tidak ada talent yang cocok dengan filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} size={16} className="text-on-surface-variant mt-0.5" />
      <div className="min-w-0">
        <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="font-body text-sm font-medium text-on-background truncate">
          {value}
        </p>
      </div>
    </div>
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
      <p className={`font-headline text-2xl font-bold mt-1 ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
