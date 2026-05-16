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
  applicantStatusColor,
  applicantStatusLabel,
  companyProfile,
  initialApplicants,
  initialHRJobs,
  matchColorClass,
  matchInRange,
  matchRangeOptions,
  universityOptions,
  type ApplicantStatus,
  type HRApplicant,
} from "@/lib/hr-mock";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

export default function ApplicantsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicantsContent />
    </Suspense>
  );
}

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const initialJobFilter = searchParams.get("job") ?? "all";

  const [applicants, setApplicants] =
    useState<HRApplicant[]>(initialApplicants);

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<string>(initialJobFilter);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [matchFilter, setMatchFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");

  const [selected, setSelected] = useState<HRApplicant | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applicants.filter((a) => {
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q);
      const matchesJob =
        jobFilter === "all" || a.jobId.toString() === jobFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesMatch = matchInRange(a.match, matchFilter);
      const matchesUni =
        universityFilter === "all" || a.university === universityFilter;
      return (
        matchesSearch &&
        matchesJob &&
        matchesStatus &&
        matchesMatch &&
        matchesUni
      );
    });
  }, [
    applicants,
    search,
    jobFilter,
    statusFilter,
    matchFilter,
    universityFilter,
  ]);

  const totalCount = applicants.length;
  const newCount = applicants.filter((a) => a.status === "new").length;
  const interviewCount = applicants.filter(
    (a) => a.status === "interview",
  ).length;
  const acceptedCount = applicants.filter(
    (a) => a.status === "accepted",
  ).length;

  const updateStatus = (id: number, status: ApplicantStatus) => {
    setApplicants(applicants.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selected?.id === id) {
      setSelected({ ...selected, status });
    }
  };

  const activeFilterCount = [
    jobFilter !== "all",
    statusFilter !== "all",
    matchFilter !== "all",
    universityFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setJobFilter("all");
    setStatusFilter("all");
    setMatchFilter("all");
    setUniversityFilter("all");
  };

  const focusedJob = useMemo(
    () =>
      jobFilter === "all"
        ? null
        : initialHRJobs.find((j) => j.id.toString() === jobFilter),
    [jobFilter],
  );

  return (
    <>
      {/* ─── Detail Modal ─── */}
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
                <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center">
                  <Icon name="person" className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-background">
                    {selected.name}
                  </h2>
                  <p className="font-body text-sm text-on-surface-variant">
                    Pelamar untuk {selected.position}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(selected.match)}`}
                    >
                      {selected.match}% match
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-xs font-semibold ${applicantStatusColor[selected.status]}`}
                    >
                      {applicantStatusLabel[selected.status]}
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
                <Detail
                  icon="school"
                  label="Universitas"
                  value={selected.university}
                />
                <Detail
                  icon="menu_book"
                  label="Jurusan"
                  value={selected.major}
                />
                <Detail icon="grade" label="IPK" value={selected.gpa} />
                <Detail
                  icon="work_history"
                  label="Pengalaman"
                  value={selected.experience}
                />
                <Detail icon="mail" label="Email" value={selected.email} />
                <Detail
                  icon="event"
                  label="Tanggal Lamar"
                  value={selected.date}
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

              <div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                  Ubah Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "new",
                      "reviewed",
                      "interview",
                      "accepted",
                      "rejected",
                    ] as ApplicantStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-full font-label text-xs font-semibold transition-colors ${
                        selected.status === s
                          ? applicantStatusColor[s]
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {applicantStatusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => updateStatus(selected.id, "interview")}
                className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 flex items-center justify-center gap-2"
              >
                <Icon name="event" size={18} />
                Undang Interview
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* ─── Header & Section Separator ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed rounded-full font-label text-xs font-semibold text-primary">
              <Icon name="inbox" size={14} />
              Pelamar Masuk
            </div>
            <h1 className="font-headline text-3xl font-bold text-on-background">
              Daftar Pelamar
            </h1>
            <p className="font-body text-on-surface-variant max-w-2xl">
              Mereka yang melamar langsung ke lowongan {companyProfile.name}.
              Untuk kandidat pasif yang cocok berdasarkan match score, lihat{" "}
              <Link
                href="/hr/talent-pool"
                className="text-primary font-semibold hover:underline"
              >
                Talent Pool
              </Link>
              .
            </p>
          </div>
        </div>

        {/* ─── Focused Job Banner ─── */}
        {focusedJob && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-fixed/40 border border-primary/20">
            <Icon name="filter_alt" className="text-primary" size={20} />
            <p className="font-body text-sm text-on-background flex-1">
              Menampilkan pelamar untuk{" "}
              <span className="font-bold">{focusedJob.title}</span> di{" "}
              {focusedJob.location}
            </p>
            <button
              onClick={() => setJobFilter("all")}
              className="font-label text-xs font-semibold text-primary hover:underline"
            >
              Tampilkan semua
            </button>
          </div>
        )}

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Pelamar" value={totalCount} tone="primary" />
          <StatBox label="Pelamar Baru" value={newCount} tone="primary-fixed" />
          <StatBox
            label="Sedang Interview"
            value={interviewCount}
            tone="blue"
          />
          <StatBox label="Diterima" value={acceptedCount} tone="green" />
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
              placeholder="Cari nama atau posisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="h-12 lg:flex-1">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 lg:w-44">
                <Icon
                  name="flag"
                  size={16}
                  className="text-on-surface-variant"
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="new">Baru</SelectItem>
                <SelectItem value="reviewed">Direview</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="accepted">Diterima</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger className="h-12 lg:w-44">
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

            <Select
              value={universityFilter}
              onValueChange={setUniversityFilter}
            >
              <SelectTrigger className="h-12 lg:w-48">
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
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="font-label text-xs text-on-surface-variant">
                {activeFilterCount} filter aktif · {filtered.length} dari{" "}
                {applicants.length} pelamar
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

        {/* ─── Table ─── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    "Pelamar",
                    "Posisi",
                    "Universitas",
                    "IPK",
                    "Match",
                    "Tanggal",
                    "Status",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                          <Icon
                            name="person"
                            className="text-primary"
                            size={18}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-medium text-on-background truncate">
                            {a.name}
                          </p>
                          <p className="font-label text-xs text-on-surface-variant truncate">
                            {a.major}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                      {a.position}
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                      {a.university}
                    </td>
                    <td className="px-6 py-4 font-label text-sm font-medium text-on-background">
                      {a.gpa}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-label text-xs font-bold ${matchColorClass(a.match)}`}
                      >
                        {a.match}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {a.date}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full font-label text-xs font-semibold ${applicantStatusColor[a.status]}`}
                      >
                        {applicantStatusLabel[a.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(a)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Icon name="visibility" size={18} />
                        </button>
                        {a.status !== "interview" &&
                          a.status !== "accepted" &&
                          a.status !== "rejected" && (
                            <button
                              onClick={() => updateStatus(a.id, "interview")}
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                              title="Undang Interview"
                            >
                              <Icon name="event_available" size={18} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center font-body text-sm text-on-surface-variant"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          name="search_off"
                          className="text-outline"
                          size={36}
                        />
                        <p>Tidak ada pelamar yang cocok dengan filter.</p>
                      </div>
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
  tone: "primary" | "primary-fixed" | "blue" | "green";
}) {
  const toneClass = {
    primary: "text-primary",
    "primary-fixed": "text-primary",
    blue: "text-blue-700",
    green: "text-green-700",
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
