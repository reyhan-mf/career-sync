"use client";

import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  companyProfile,
  initialHRJobs,
  initialTalents,
  inviteStatusColor,
  inviteStatusLabel,
  matchColorClass,
  matchInRange,
  matchRangeOptions,
  universityOptions,
  type HRTalent,
  type InviteStatus,
} from "@/lib/hr-mock";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function TalentPoolPage() {
  const [talents, setTalents] = useState<HRTalent[]>(initialTalents);

  const [search, setSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [inviteFilter, setInviteFilter] = useState("all");

  const [selected, setSelected] = useState<HRTalent | null>(null);
  const [inviteJobId, setInviteJobId] = useState<string>("");

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    talents.forEach((t) => t.skills.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [talents]);
  const [skillFilter, setSkillFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return talents
      .filter((t) => {
        const matchesSearch =
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.university.toLowerCase().includes(q) ||
          t.major.toLowerCase().includes(q);
        const matchesMatch = matchInRange(t.match, matchFilter);
        const matchesUni =
          universityFilter === "all" || t.university === universityFilter;
        const matchesJob =
          jobFilter === "all" || t.bestMatchJobId.toString() === jobFilter;
        const matchesSkill =
          skillFilter === "all" || t.skills.includes(skillFilter);
        const matchesInvite =
          inviteFilter === "all" || t.inviteStatus === inviteFilter;
        return (
          matchesSearch &&
          matchesMatch &&
          matchesUni &&
          matchesJob &&
          matchesSkill &&
          matchesInvite
        );
      })
      .sort((a, b) => b.match - a.match);
  }, [
    talents,
    search,
    matchFilter,
    universityFilter,
    jobFilter,
    skillFilter,
    inviteFilter,
  ]);

  const total = talents.length;
  const notContacted = talents.filter(
    (t) => t.inviteStatus === "not_contacted",
  ).length;
  const invitedCount = talents.filter(
    (t) => t.inviteStatus === "invited",
  ).length;
  const respondedCount = talents.filter(
    (t) => t.inviteStatus === "responded",
  ).length;

  const activeFilterCount = [
    matchFilter !== "all",
    universityFilter !== "all",
    jobFilter !== "all",
    skillFilter !== "all",
    inviteFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setMatchFilter("all");
    setUniversityFilter("all");
    setJobFilter("all");
    setSkillFilter("all");
    setInviteFilter("all");
  };

  const updateInviteStatus = (id: number, status: InviteStatus) => {
    setTalents(
      talents.map((t) => (t.id === id ? { ...t, inviteStatus: status } : t)),
    );
    if (selected?.id === id) {
      setSelected({ ...selected, inviteStatus: status });
    }
  };

  const openInvite = (t: HRTalent) => {
    setSelected(t);
    setInviteJobId(t.bestMatchJobId.toString());
  };

  const handleInvite = () => {
    if (!selected) return;
    updateInviteStatus(selected.id, "invited");
  };

  return (
    <>
      {/* ─── Detail / Invite Modal ─── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
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
                    {selected.name}
                  </h2>
                  <p className="font-body text-sm text-on-surface-variant">
                    {selected.major} · {selected.university}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(selected.match)}`}
                    >
                      {selected.match}% match
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${inviteStatusColor[selected.inviteStatus]}`}
                    >
                      {inviteStatusLabel[selected.inviteStatus]}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors shrink-0"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Detail icon="grade" label="IPK" value={selected.gpa} />
                <Detail icon="event" label="Lulus" value={selected.graduated} />
                <Detail
                  icon="work_history"
                  label="Pengalaman"
                  value={selected.experience}
                />
                <Detail
                  icon="location_on"
                  label="Domisili"
                  value={selected.location}
                />
                <Detail icon="mail" label="Email" value={selected.email} />
                <Detail
                  icon="star"
                  label="Cocok untuk"
                  value={selected.bestMatchJobTitle}
                />
              </div>

              <div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full font-label text-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                  Insight CLO
                </p>
                <div className="space-y-2">
                  {selected.cloMatches.map((m) => (
                    <div
                      key={m.clo}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <p className="font-label text-xs font-semibold text-on-background">
                          {m.clo}
                        </p>
                        <p className="font-body text-xs text-on-surface-variant truncate">
                          {m.qualification}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${cloScoreClass(m.score)}`}
                      >
                        {m.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.inviteStatus === "not_contacted" && (
                <div className="p-4 rounded-xl bg-primary-fixed/40 border border-primary/20 space-y-3">
                  <p className="font-label text-sm font-semibold text-primary">
                    Undang kandidat ini untuk melamar:
                  </p>
                  <Select value={inviteJobId} onValueChange={setInviteJobId}>
                    <SelectTrigger className="h-11 w-full bg-surface-container-lowest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {initialHRJobs
                        .filter(
                          (j) =>
                            j.status === "active" || j.status === "closing",
                        )
                        .map((j) => (
                          <SelectItem key={j.id} value={j.id.toString()}>
                            {j.title} — {j.location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selected.inviteStatus !== "not_contacted" && (
                <div className="p-4 rounded-xl bg-surface-container-low">
                  <p className="font-label text-sm font-semibold text-on-background mb-1">
                    Status undangan: {inviteStatusLabel[selected.inviteStatus]}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    {selected.inviteStatus === "invited" &&
                      `Undangan telah dikirim ke ${selected.email}. Menunggu respon.`}
                    {selected.inviteStatus === "responded" &&
                      "Kandidat telah merespon undangan Anda."}
                    {selected.inviteStatus === "declined" &&
                      "Kandidat menolak undangan Anda."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
              {selected.inviteStatus === "not_contacted" ? (
                <button
                  type="button"
                  onClick={handleInvite}
                  className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 flex items-center justify-center gap-2"
                >
                  <Icon name="send" size={18} />
                  Kirim Undangan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updateInviteStatus(selected.id, "not_contacted")
                  }
                  className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label font-semibold transition-colors"
                >
                  Batalkan Undangan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* ─── Header & Section Separator ─── */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-full font-label text-xs font-semibold text-tertiary">
            <Icon name="auto_awesome" size={14} filled />
            Kandidat Pasif (Match-based)
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Talent Pool
          </h1>
          <p className="font-body text-on-surface-variant max-w-2xl">
            Kandidat yang cocok dengan lowongan {companyProfile.name}{" "}
            berdasarkan skor match — mereka belum melamar, tapi bisa Anda
            undang. Untuk pelamar aktif, lihat{" "}
            <Link
              href="/hr/applicants"
              className="text-primary font-semibold hover:underline"
            >
              Daftar Pelamar
            </Link>
            .
          </p>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Talent" value={total} tone="tertiary" />
          <StatBox
            label="Belum Diundang"
            value={notContacted}
            tone="on-surface"
          />
          <StatBox label="Sudah Diundang" value={invitedCount} tone="primary" />
          <StatBox label="Merespon" value={respondedCount} tone="green" />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border space-y-3">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari nama, universitas, atau jurusan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon
                  name="bolt"
                  size={16}
                  className="text-on-surface-variant"
                />
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
                <Icon
                  name="work"
                  size={16}
                  className="text-on-surface-variant"
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lowongan</SelectItem>
                {initialHRJobs.map((j) => (
                  <SelectItem key={j.id} value={j.id.toString()}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={universityFilter}
              onValueChange={setUniversityFilter}
            >
              <SelectTrigger className="h-12 w-full">
                <Icon
                  name="school"
                  size={16}
                  className="text-on-surface-variant"
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Universitas</SelectItem>
                {universityOptions.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="h-12 w-full">
                <Icon
                  name="code"
                  size={16}
                  className="text-on-surface-variant"
                />
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
                {activeFilterCount} filter aktif · {filtered.length} dari{" "}
                {talents.length} talent
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

        {/* ─── Talent Table ─── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="w-full">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[8%]" />
                <col className="w-[20%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
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
                {filtered.map((t) => (
                  <tr
                    key={t.id}
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
                            {t.name}
                          </p>
                          <p className="font-label text-xs text-on-surface-variant truncate">
                            {t.major} · {t.university}
                          </p>
                          <p className="font-label text-xs text-on-surface-variant mt-0.5">
                            IPK {t.gpa} · {t.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(t.match)}`}
                      >
                        {t.match}%
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-label text-sm font-semibold text-on-background truncate">
                        {t.bestMatchJobTitle}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {t.skills.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-surface-container rounded-md font-label text-xs text-on-surface-variant"
                          >
                            {s}
                          </span>
                        ))}
                        {t.skills.length > 2 && (
                          <span className="px-2 py-0.5 font-label text-xs text-on-surface-variant">
                            +{t.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${inviteStatusColor[t.inviteStatus]}`}
                      >
                        {inviteStatusLabel[t.inviteStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelected(t);
                            setInviteJobId(t.bestMatchJobId.toString());
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Icon name="visibility" size={18} />
                        </button>
                        {t.inviteStatus === "not_contacted" && (
                          <button
                            onClick={() => openInvite(t)}
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
                      Tidak ada talent yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

function cloScoreClass(score: number) {
  if (score >= 85) return "text-green-700 bg-green-50";
  if (score >= 70) return "text-primary bg-primary-fixed";
  return "text-tertiary bg-tertiary-fixed";
}
