"use client";

import Icon from "@/components/ui/Icon";
import CompetencyInsight from "@/components/hr/CompetencyInsight";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRowsSkeleton } from "@/components/ui/Skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteStatusColor,
  inviteStatusLabel,
  matchColorClass,
  matchInRange,
  matchRangeOptions,
  type InviteStatus,
} from "@/lib/hr-mock";
import { bestMatchJob, gradesByCloId, rbcByJobId, studentSkills } from "@/lib/hr-match";
import {
  cancelInvitation,
  inviteTalent,
  type JobWithSkills,
  type TalentCLOGrade,
  type TalentInvitation,
  type TalentStudent,
} from "@/lib/supabase/hr-queries";
import {
  getJobMatchBreakdown,
  type ReqMatchBreakdown,
} from "@/lib/supabase/student-queries";
import { hrDataMutators } from "@/lib/supabase/hrDataStore";
import { reportHrError } from "@/lib/supabase/hrErrors";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHRData } from "../HRDataProvider";

interface TalentRow {
  talent: TalentStudent;
  grades: TalentCLOGrade[];
  bestJob: JobWithSkills | null;
  matchScore: number;
  skills: string[];
  invite: TalentInvitation | null;
  uiStatus: InviteStatus;
  prodiName: string;
}

export default function TalentPoolPage() {
  const { hr, company, jobs, talents, talentGrades, reqBestClos, invitations, prodiNames, loading, error } =
    useHRData();

  const [search, setSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [prodiFilter, setProdiFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [inviteFilter, setInviteFilter] = useState("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteJobId, setInviteJobId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Per-requirement CLO breakdown for a talent vs their best-match job — same
  // RPC the student job-detail page uses (student_job_match_breakdown). Cached
  // per (talent, job) so every talent fetches at most once and re-opening one is
  // instant. We also prefetch the visible talents below, so opening any of them
  // shows the analysis immediately instead of one being instant and the next
  // flashing a loader.
  type BreakdownEntry = { rows: ReqMatchBreakdown[]; status: "ready" | "error" };
  const [breakdownCache, setBreakdownCache] = useState<Map<string, BreakdownEntry>>(
    new Map(),
  );
  const inFlight = useRef<Set<string>>(new Set());

  const breakdownKey = (talentId: string, jobId: string) => `${talentId}:${jobId}`;

  const fetchBreakdown = useCallback((talentId: string, jobId: string) => {
    const key = breakdownKey(talentId, jobId);
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    getJobMatchBreakdown(talentId, jobId)
      .then((rows) =>
        setBreakdownCache((prev) => new Map(prev).set(key, { rows, status: "ready" })),
      )
      .catch(() =>
        setBreakdownCache((prev) =>
          new Map(prev).set(key, { rows: [], status: "error" }),
        ),
      )
      .finally(() => inFlight.current.delete(key));
  }, []);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "active" || j.status === "closing"),
    [jobs],
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

  // requirement→best-CLO rows grouped by job, shared across all talent rows.
  const rbcByJob = useMemo(() => rbcByJobId(reqBestClos), [reqBestClos]);

  const inviteByStudent = useMemo(() => {
    const map = new Map<string, TalentInvitation>();
    invitations.forEach((i) => {
      if (i.student_id) map.set(i.student_id, i);
    });
    return map;
  }, [invitations]);

  const rows = useMemo<TalentRow[]>(() => {
    return talents.map((t) => {
      const grades = gradesByStudent.get(t.id) ?? [];
      const best = bestMatchJob(gradesByCloId(grades), activeJobs, rbcByJob);
      const skills = studentSkills(grades);
      const invite = inviteByStudent.get(t.id) ?? null;
      const uiStatus: InviteStatus = invite ? invite.status : "not_contacted";
      return {
        talent: t,
        grades,
        bestJob: best?.job ?? null,
        matchScore: best?.score ?? 0,
        skills,
        invite,
        uiStatus,
        prodiName: t.prodi_id ? prodiNames[t.prodi_id] ?? "—" : "—",
      };
    });
  }, [talents, gradesByStudent, activeJobs, rbcByJob, inviteByStudent, prodiNames]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.skills.forEach((s) => set.add(s)));
    return [...set].sort();
  }, [rows]);

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
        const matchesMatch = matchInRange(r.matchScore, matchFilter);
        const matchesProdi = prodiFilter === "all" || r.prodiName === prodiFilter;
        const matchesJob = jobFilter === "all" || r.bestJob?.id === jobFilter;
        const matchesSkill = skillFilter === "all" || r.skills.includes(skillFilter);
        const matchesInvite =
          inviteFilter === "all" || r.uiStatus === inviteFilter;
        return (
          matchesSearch &&
          matchesMatch &&
          matchesProdi &&
          matchesJob &&
          matchesSkill &&
          matchesInvite
        );
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [rows, search, matchFilter, prodiFilter, jobFilter, skillFilter, inviteFilter]);

  const total = rows.length;
  const notContacted = rows.filter((r) => r.uiStatus === "not_contacted").length;
  const invitedCount = rows.filter((r) => r.uiStatus === "invited").length;
  const respondedCount = rows.filter((r) => r.uiStatus === "responded").length;

  const activeFilterCount = [
    matchFilter !== "all",
    prodiFilter !== "all",
    jobFilter !== "all",
    skillFilter !== "all",
    inviteFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setMatchFilter("all");
    setProdiFilter("all");
    setJobFilter("all");
    setSkillFilter("all");
    setInviteFilter("all");
  };

  const selected = filtered.find((r) => r.talent.id === selectedId)
    ?? rows.find((r) => r.talent.id === selectedId)
    ?? null;

  const insightTalentId = selected?.talent.id ?? null;
  const insightJobId = selected?.bestJob?.id ?? null;

  // Fetch the open talent's CLO breakdown if it isn't cached yet. Reuses the
  // student-side RPC so the numbers match /student/jobs/[id].
  useEffect(() => {
    if (!insightTalentId || !insightJobId) return;
    if (breakdownCache.has(breakdownKey(insightTalentId, insightJobId))) return;
    fetchBreakdown(insightTalentId, insightJobId);
  }, [insightTalentId, insightJobId, breakdownCache, fetchBreakdown]);

  // Background-prefetch breakdowns for the visible (filtered, score-sorted)
  // talents so opening any of them is instant. Capped so a large pool doesn't
  // fire hundreds of RPCs at once; the rest still load on demand from the effect
  // above. Already-cached / in-flight pairs are skipped.
  useEffect(() => {
    filtered
      .filter((r) => r.bestJob)
      .slice(0, 25)
      .forEach((r) => {
        if (!breakdownCache.has(breakdownKey(r.talent.id, r.bestJob!.id))) {
          fetchBreakdown(r.talent.id, r.bestJob!.id);
        }
      });
  }, [filtered, breakdownCache, fetchBreakdown]);

  const currentEntry =
    insightTalentId && insightJobId
      ? breakdownCache.get(breakdownKey(insightTalentId, insightJobId))
      : undefined;
  const breakdown = currentEntry?.status === "ready" ? currentEntry.rows : [];
  const breakdownLoading = !!insightJobId && !currentEntry;
  const breakdownError = currentEntry?.status === "error";

  const openTalent = (row: TalentRow) => {
    setSelectedId(row.talent.id);
    setInviteJobId(row.bestJob?.id ?? activeJobs[0]?.id ?? "");
    setActionError(null);
  };

  const closeTalent = () => {
    setSelectedId(null);
    setActionError(null);
  };

  const handleInvite = async () => {
    if (!selected || !hr || !inviteJobId) return;
    setBusy(true);
    setActionError(null);
    try {
      const inv = await inviteTalent(hr.id, selected.talent.id, inviteJobId);
      hrDataMutators.setInvitations((prev) => {
        const without = prev.filter((p) => p.id !== inv.id);
        return [...without, inv];
      });
    } catch (e) {
      setActionError(reportHrError(e, "talentPool.invite"));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!selected || !selected.invite) return;
    setBusy(true);
    setActionError(null);
    const inviteId = selected.invite.id;
    try {
      await cancelInvitation(inviteId);
      hrDataMutators.setInvitations((prev) => prev.filter((p) => p.id !== inviteId));
    } catch (e) {
      setActionError(reportHrError(e, "talentPool.cancelInvite"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
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
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
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

  return (
    <>
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
                <Detail
                  icon="star"
                  label="Cocok untuk"
                  value={selected.bestJob?.title ?? "—"}
                />
                <Detail
                  icon="bolt"
                  label="Status"
                  value={selected.talent.status}
                />
              </div>

              <CompetencyInsight
                key={selected.talent.id}
                jobTitle={selected.bestJob?.title ?? null}
                breakdown={breakdown}
                loading={breakdownLoading}
                error={breakdownError}
              />

              {selected.uiStatus === "not_contacted" && activeJobs.length > 0 && (
                <div className="p-4 rounded-xl bg-primary-fixed/40 border border-primary/20 space-y-3">
                  <p className="font-label text-sm font-semibold text-primary">
                    Undang kandidat ini untuk melamar:
                  </p>
                  <Select value={inviteJobId} onValueChange={setInviteJobId}>
                    <SelectTrigger className="h-11 w-full bg-surface-container-lowest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeJobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title}
                          {j.location ? ` — ${j.location}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selected.uiStatus === "not_contacted" && activeJobs.length === 0 && (
                <div className="p-4 rounded-xl bg-surface-container-low text-center">
                  <p className="font-body text-sm text-on-surface-variant">
                    Belum ada lowongan aktif untuk mengundang kandidat.{" "}
                    <Link href="/hr/jobs?new=1" className="text-primary hover:underline">
                      Buat lowongan
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
                      `Undangan telah dikirim. Menunggu respon dari kandidat.`}
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
                  disabled={busy || !inviteJobId || activeJobs.length === 0}
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
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-full font-label text-xs font-semibold text-tertiary">
            <Icon name="auto_awesome" size={14} filled />
            Kandidat Pasif (Match-based)
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Talent Pool
          </h1>
          <p className="font-body text-on-surface-variant max-w-2xl">
            Mahasiswa aktif yang cocok dengan lowongan {company?.name ?? "perusahaan Anda"}{" "}
            berdasarkan skor match. Untuk pelamar aktif, lihat{" "}
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Talent" value={total} tone="tertiary" />
          <StatBox label="Belum Diundang" value={notContacted} tone="on-surface" />
          <StatBox label="Sudah Diundang" value={invitedCount} tone="primary" />
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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon name="bolt" size={16} className="text-on-surface-variant" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {matchRangeOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon name="work" size={16} className="text-on-surface-variant" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lowongan</SelectItem>
                {activeJobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prodiFilter} onValueChange={setProdiFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon name="school" size={16} className="text-on-surface-variant" />
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

            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon name="code" size={16} className="text-on-surface-variant" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Skill</SelectItem>
                {allSkills.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
                <SelectItem value="not_contacted">Belum Diundang</SelectItem>
                <SelectItem value="invited">Diundang</SelectItem>
                <SelectItem value="responded">Merespon</SelectItem>
                <SelectItem value="declined">Menolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="font-label text-xs text-on-surface-variant">
                {activeFilterCount} filter aktif · {filtered.length} dari {rows.length} talent
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
                <col className="w-[26%]" />
                <col className="w-[8%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    "Talent",
                    "Match",
                    "Lowongan",
                    "Skills",
                    "Undangan",
                    "Aksi",
                  ].map((h) => (
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
                {filtered.map((r) => (
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
                      <p className="font-label text-sm font-semibold text-on-background truncate">
                        {r.bestJob?.title ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {r.skills.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-surface-container rounded-md font-label text-xs text-on-surface-variant"
                          >
                            {s}
                          </span>
                        ))}
                        {r.skills.length > 2 && (
                          <span className="px-2 py-0.5 font-label text-xs text-on-surface-variant">
                            +{r.skills.length - 2}
                          </span>
                        )}
                        {r.skills.length === 0 && (
                          <span className="font-label text-xs text-on-surface-variant">—</span>
                        )}
                      </div>
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
                        {r.uiStatus === "not_contacted" && activeJobs.length > 0 && (
                          <button
                            onClick={() => openTalent(r)}
                            className="p-2 text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                            aria-label="Undang kandidat"
                          >
                            <Icon name="send" size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td
                      colSpan={6}
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

        {!hr && (
          <div className="px-4 py-3 bg-surface-container-low rounded-xl flex justify-center">
            <Skeleton className="h-4 w-40" />
          </div>
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
      <p className={`font-headline text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

