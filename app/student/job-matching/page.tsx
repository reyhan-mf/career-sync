"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const allJobs = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechIndo",
    match: 52.8,
    location: "Jakarta",
    type: "Full-time",
    category: "Web",
    salary: "Rp 8-12 jt",
    requirements: 4,
    posted: "2 hari lalu",
  },
  {
    id: 2,
    title: "Android Developer",
    company: "Google Indonesia",
    match: 54.6,
    location: "Jakarta",
    type: "Full-time",
    category: "Mobile",
    salary: "Rp 15-25 jt",
    requirements: 5,
    posted: "1 hari lalu",
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "DataCorp",
    match: 43.2,
    location: "Bandung",
    type: "Full-time",
    category: "Data",
    salary: "Rp 7-10 jt",
    requirements: 4,
    posted: "3 hari lalu",
  },
  {
    id: 4,
    title: "Backend Developer",
    company: "CloudID",
    match: 61.5,
    location: "Jakarta",
    type: "Full-time",
    category: "Web",
    salary: "Rp 10-15 jt",
    requirements: 4,
    posted: "1 hari lalu",
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "NetSol",
    match: 35.7,
    location: "Surabaya",
    type: "Contract",
    category: "DevOps",
    salary: "Rp 9-14 jt",
    requirements: 5,
    posted: "5 hari lalu",
  },
  {
    id: 6,
    title: "Machine Learning Engineer",
    company: "AI Labs",
    match: 38.4,
    location: "Remote",
    type: "Full-time",
    category: "AI/ML",
    salary: "Rp 12-18 jt",
    requirements: 5,
    posted: "1 minggu lalu",
  },
  {
    id: 7,
    title: "Full-stack Developer",
    company: "Tokopedia",
    match: 58.1,
    location: "Jakarta",
    type: "Full-time",
    category: "Web",
    salary: "Rp 12-20 jt",
    requirements: 5,
    posted: "2 hari lalu",
  },
  {
    id: 8,
    title: "UI/UX Designer",
    company: "DesignLab",
    match: 29.5,
    location: "Yogyakarta",
    type: "Part-time",
    category: "Design",
    salary: "Rp 5-8 jt",
    requirements: 3,
    posted: "4 hari lalu",
  },
];

const MATCH_OPTIONS = [
  { value: "all", label: "Semua Level" },
  { value: "high", label: "Tinggi ≥55%" },
  { value: "medium", label: "Sedang 40–55%" },
  { value: "low", label: "Rendah <40%" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "Web", label: "Web" },
  { value: "Mobile", label: "Mobile" },
  { value: "Data", label: "Data" },
  { value: "DevOps", label: "DevOps" },
  { value: "AI/ML", label: "AI/ML" },
  { value: "Design", label: "Design" },
];

function getMatchColor(match: number) {
  if (match >= 55) return "text-green-700 bg-green-50";
  if (match >= 40) return "text-primary bg-primary-fixed";
  return "text-tertiary bg-tertiary-fixed";
}

function getMatchLabel(match: number) {
  if (match >= 55) return "Tinggi";
  if (match >= 40) return "Sedang";
  return "Rendah";
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle(null);
      }
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
                onClick={() => {
                  onChange(opt.value);
                  onToggle(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 font-label text-sm transition-colors hover:bg-primary-fixed/50 text-on-surface"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary-container border-primary-container"
                      : "border-outline-variant"
                  }`}
                >
                  {isSelected && (
                    <Icon name="check" size={11} className="text-on-primary-container" />
                  )}
                </div>
                <span className={isSelected ? "font-semibold text-primary-container" : ""}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JobMatchingPage() {
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy] = useState("match_desc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const activeFilterCount = [
    matchFilter !== "all",
    typeFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length;

  const filteredJobs = useMemo(() => {
    const result = allJobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());
      const matchesLocation =
        !locationSearch ||
        job.location.toLowerCase().includes(locationSearch.toLowerCase());
      const matchesMatch =
        matchFilter === "all" ||
        (matchFilter === "high" && job.match >= 55) ||
        (matchFilter === "medium" && job.match >= 40 && job.match < 55) ||
        (matchFilter === "low" && job.match < 40);
      const matchesType = typeFilter === "all" || job.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || job.category === categoryFilter;
      return (
        matchesSearch &&
        matchesLocation &&
        matchesMatch &&
        matchesType &&
        matchesCategory
      );
    });

    result.sort((a, b) => {
      if (sortBy === "match_desc") return b.match - a.match;
      if (sortBy === "match_asc") return a.match - b.match;
      return 0;
    });

    return result;
  }, [search, locationSearch, matchFilter, typeFilter, categoryFilter, sortBy]);

  function resetFilters() {
    setMatchFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">
          Job Matching
        </h1>
        <p className="font-body text-on-surface-variant">
          Rekomendasi lowongan berdasarkan pencocokan CLO dan kompetensi Anda
          menggunakan Sentence-BERT.
        </p>
      </div>

      {/* Search Bar + Filter Chips */}
      <div className="space-y-3">
        {/* JobStreet-style search row */}
        <div className="flex items-center gap-3">
          {/* Job title search */}
          <div className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari lowongan atau perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-12 pr-4 py-3
                outline-none focus:ring-2 focus:ring-primary-container/25 focus:border-primary-container/40
                font-body text-sm placeholder:text-outline text-on-surface shadow-ambient ghost-border transition-all"
            />
          </div>

          {/* Location search */}
          <div className="relative w-60 shrink-0">
            <Icon
              name="location_on"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              size={18}
            />
            <input
              type="text"
              placeholder="Masukkan kota atau wilayah"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-11 pr-4 py-3
                outline-none focus:ring-2 focus:ring-primary-container/25 focus:border-primary-container/40
                font-body text-sm placeholder:text-outline text-on-surface shadow-ambient ghost-border transition-all"
            />
          </div>

          {/* Cari button */}
          <button className="bg-primary text-on-primary px-7 py-3 rounded-2xl font-label text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shrink-0 shadow-sm">
            Cari
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownFilter
            name="match"
            label="Match"
            options={MATCH_OPTIONS}
            value={matchFilter}
            onChange={setMatchFilter}
            openDropdown={openDropdown}
            onToggle={setOpenDropdown}
          />
          <DropdownFilter
            name="type"
            label="Jenis"
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            openDropdown={openDropdown}
            onToggle={setOpenDropdown}
          />
          <DropdownFilter
            name="category"
            label="Bidang"
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={setCategoryFilter}
            openDropdown={openDropdown}
            onToggle={setOpenDropdown}
          />
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

      {/* Results count */}
      <p className="font-label text-sm text-on-surface-variant">
        Menampilkan {filteredJobs.length} dari {allJobs.length} lowongan
      </p>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border hover:bg-surface-container-high transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-headline text-lg font-bold text-on-background group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="font-label text-sm text-on-surface-variant mt-1">
                  {job.company}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-3 py-1 rounded-full font-label text-sm font-bold ${getMatchColor(job.match)}`}
                >
                  {job.match.toFixed(1)}%
                </span>
                <span className="font-label text-[10px] text-on-surface-variant">
                  {getMatchLabel(job.match)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-3">
              <span className="font-label text-xs text-on-surface-variant">
                {job.requirements} requirements dianalisis
              </span>
            </div>

            <div className="flex items-center gap-4 font-label text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="location_on" size={16} />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="work" size={16} />
                {job.type}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="payments" size={16} />
                {job.salary}
              </span>
              <span className="ml-auto text-outline">{job.posted}</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16">
          <Icon
            name="search_off"
            className="text-outline mx-auto mb-4"
            size={48}
          />
          <p className="font-headline text-lg text-on-surface-variant">
            Tidak ada lowongan yang ditemukan
          </p>
          <p className="font-body text-sm text-outline mt-2">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </div>
      )}
    </div>
  );
}
