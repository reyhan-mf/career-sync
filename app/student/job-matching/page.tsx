"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentData } from "../StudentDataProvider";
import { studentDataMutators } from "@/lib/supabase/studentDataStore";
import GradeBasisToggle, {
  STUDENT_BASIS_OPTIONS,
} from "@/components/ui/GradeBasisToggle";

function JobCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full shrink-0" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
];

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hari ini";
  if (days === 1) return "1 hari lalu";
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function matchBadgeClass(score: number | null): string {
  if (score == null) return "bg-surface-container text-on-surface-variant";
  if (score >= 85) return "bg-green-50 text-green-700";
  if (score >= 70) return "bg-primary-fixed text-primary";
  if (score >= 55) return "bg-tertiary-fixed text-on-tertiary-container";
  return "bg-error-container text-error";
}

function DropdownFilter({
  name,
  label,
  options,
  value,
  onChange,
  openDropdown,
  onToggle,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  openDropdown: string | null;
  onToggle: (name: string | null) => void;
}) {
  const isOpen = openDropdown === name;
  const isActive = value !== "all";
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => onToggle(isOpen ? null : name)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-label text-sm transition-all ${
          isActive
            ? "bg-primary-container text-on-primary-container border-primary-container"
            : "bg-surface-container-lowest border-outline-variant/50 text-on-surface-variant hover:bg-primary-fixed/40 hover:border-primary-container/30"
        }`}
      >
        {isActive ? activeLabel : label}
        <Icon name={isOpen ? "expand_less" : "expand_more"} size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 z-50 py-1 min-w-48">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); onToggle(null); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 font-label text-sm transition-colors hover:bg-primary-fixed/50 text-on-surface"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                  isSelected ? "bg-primary-container border-primary-container" : "border-outline-variant"
                }`}>
                  {isSelected && <Icon name="check" size={11} className="text-on-primary-container" />}
                </div>
                <span className={isSelected ? "font-semibold text-primary-container" : ""}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 12;

export default function JobMatchingPage() {
  const {
    jobs,
    matchScores,
    loading,
    error,
    profile,
    gradeBasis,
    matchScoresLoading,
    transcript,
  } = useStudentData();

  // Offering a CLO view to a student whose prodi records no CLO grades would
  // just show an all-zero ranking, so the toggle is hidden for them.
  const hasCloGrades = useMemo(
    () => transcript.some((c) => c.clos.some((clo) => clo.grade != null)),
    [transcript],
  );

  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(jobs.map((j) => j.category).filter((c): c is string => !!c))].sort();
    return [{ value: "all", label: "Semua" }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [jobs]);

  const activeFilterCount = [typeFilter !== "all", categoryFilter !== "all"].filter(Boolean).length;

  // Match scores are computed in Postgres (grade-weighted CLO↔requirement
  // similarity) and arrive via the student data store. A job missing from the
  // map has no score yet (e.g. student has no grades) → null.
  const scoredJobs = useMemo(() => {
    return jobs.map((job) => ({
      ...job,
      matchScore: matchScores[job.id] ?? null,
    }));
  }, [jobs, matchScores]);

  const filteredJobs = useMemo(() => {
    const filtered = scoredJobs.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = !locationSearch || (job.location ?? "").toLowerCase().includes(locationSearch.toLowerCase());
      const matchesType = typeFilter === "all" || job.job_type === typeFilter;
      const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
      return matchesSearch && matchesLocation && matchesType && matchesCategory;
    });
    // Sort: highest match first; nulls (no grades) go last
    filtered.sort((a, b) => {
      const sa = a.matchScore ?? -1;
      const sb = b.matchScore ?? -1;
      return sb - sa;
    });
    return filtered;
  }, [scoredJobs, search, locationSearch, typeFilter, categoryFilter]);

  // Reset the visible window whenever the filters change (new search, filter)
  // so the user starts from the top. Done by adjusting state during render
  // rather than in an effect — avoids the extra commit + cascading render.
  // See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const filterKey = `${search}|${locationSearch}|${typeFilter}|${categoryFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJobs.length;

  // Infinite scroll: grow the window when the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredJobs.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, filteredJobs.length]);

  function resetFilters() {
    setTypeFilter("all");
    setCategoryFilter("all");
  }

  if (loading && !profile) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-60 shrink-0 rounded-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">Job Matching</h1>
        <p className="font-body text-on-surface-variant">
          Lowongan aktif yang dapat Anda lamar.
        </p>
        {/* Which grade the % badges below are weighted by. Shares state with
            the "Analisis Kompetensi" tab, so both screens always agree. */}
        {hasCloGrades && (
          <div className="pt-1">
            <GradeBasisToggle
              label="Skor dihitung dari"
              value={gradeBasis}
              options={STUDENT_BASIS_OPTIONS}
              onChange={(v) => studentDataMutators.setGradeBasis(v)}
              disabled={matchScoresLoading}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              type="text"
              placeholder="Cari lowongan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-container/25 focus:border-primary-container/40 font-body text-sm placeholder:text-outline text-on-surface shadow-ambient ghost-border transition-all"
            />
          </div>
          <div className="relative w-60 shrink-0">
            <Icon name="location_on" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              type="text"
              placeholder="Masukkan kota atau wilayah"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-container/25 focus:border-primary-container/40 font-body text-sm placeholder:text-outline text-on-surface shadow-ambient ghost-border transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownFilter name="type" label="Jenis" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} openDropdown={openDropdown} onToggle={setOpenDropdown} />
          <DropdownFilter name="category" label="Bidang" options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} openDropdown={openDropdown} onToggle={setOpenDropdown} />
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-label text-xs text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary-container transition-colors border border-outline-variant/50"
            >
              <Icon name="close" size={14} />
              Reset filter
            </button>
          )}
        </div>
      </div>

      <p className="font-label text-sm text-on-surface-variant">
        {matchScoresLoading
          ? "Menghitung ulang skor kecocokan..."
          : `Menampilkan ${filteredJobs.length} dari ${jobs.length} lowongan aktif`}
      </p>

      {/* Switching the basis re-scores every job server-side. Show skeletons
          rather than the previous basis' numbers, which would briefly read as
          if they belonged to the newly selected basis. */}
      {matchScoresLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <Icon name={jobs.length === 0 ? "work_off" : "search_off"} className="text-outline mx-auto mb-4" size={48} />
          <p className="font-headline text-lg text-on-surface-variant">
            {jobs.length === 0 ? "Belum ada lowongan aktif saat ini." : "Tidak ada lowongan yang ditemukan."}
          </p>
          {jobs.length > 0 && (
            <p className="font-body text-sm text-outline mt-2">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleJobs.map((job) => (
            <Link
              key={job.id}
              href={`/student/jobs/${job.id}`}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border hover:bg-surface-container-high transition-all group"
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-lg font-bold text-on-background group-hover:text-primary transition-colors truncate">
                    {job.title}
                  </h3>
                  {job.category && (
                    <p className="font-label text-sm text-on-surface-variant mt-1">{job.category}</p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-xs font-bold ${matchBadgeClass(job.matchScore)}`}>
                  <Icon name="bolt" size={12} />
                  {job.matchScore != null ? `${job.matchScore}%` : "—"}
                </span>
              </div>

              {job.job_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.job_skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary-fixed text-primary rounded-full font-label text-[10px] font-semibold">
                      {s.skill}
                    </span>
                  ))}
                  {job.job_skills.length > 4 && (
                    <span className="font-label text-[10px] text-on-surface-variant">
                      +{job.job_skills.length - 4} lainnya
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 font-label text-xs text-on-surface-variant flex-wrap">
                {job.location && <span className="flex items-center gap-1"><Icon name="location_on" size={16} />{job.location}</span>}
                {job.job_type && <span className="flex items-center gap-1"><Icon name="work" size={16} />{job.job_type}</span>}
                {job.salary && <span className="flex items-center gap-1"><Icon name="payments" size={16} />{job.salary}</span>}
                <span className="ml-auto text-outline">{relativeTime(job.posted_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      )}
    </div>
  );
}
