"use client";

import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const recentJobs = [
  {
    title: "Frontend Developer",
    company: "TechIndo",
    match: 92,
    location: "Jakarta",
    type: "Full-time",
    icon: "code",
  },
  {
    title: "Data Analyst",
    company: "DataCorp",
    match: 87,
    location: "Bandung",
    type: "Full-time",
    icon: "analytics",
  },
  {
    title: "System Admin",
    company: "NetSol",
    match: 78,
    location: "Surabaya",
    type: "Contract",
    icon: "dns",
  },
];

const competencies = [
  { name: "Web Development", level: 85 },
  { name: "Data Analysis", level: 72 },
  { name: "Database Management", level: 68 },
  { name: "Problem Solving", level: 90 },
];

function getMatchBadge(match: number) {
  if (match >= 85) return "bg-green-50 text-green-700";
  if (match >= 75) return "bg-primary-fixed text-primary";
  return "bg-tertiary-fixed text-on-tertiary-container";
}

function getGrade(level: number): { label: string; bg: string; text: string } {
  if (level >= 90) return { label: "A", bg: "bg-green-50", text: "text-green-700" };
  if (level >= 85) return { label: "A-", bg: "bg-green-50", text: "text-green-600" };
  if (level >= 80) return { label: "B+", bg: "bg-primary-fixed", text: "text-primary" };
  if (level >= 75) return { label: "B", bg: "bg-primary-fixed", text: "text-primary" };
  if (level >= 70) return { label: "B-", bg: "bg-tertiary-fixed", text: "text-on-tertiary-container" };
  return { label: "C+", bg: "bg-surface-container", text: "text-on-surface-variant" };
}

export default function StudentDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-on-background">
          Selamat Datang, Budi Santoso
        </h1>
        <p className="font-body text-on-surface-variant">
          Track your career journey and discover matching opportunities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="grade"
          label="IPK"
          value="3.93"
          iconBgClass="bg-primary-fixed"
          iconTextClass="text-primary"
        />
        <StatCard
          icon="school"
          label="CLO Tercapai"
          value="18/24"
          trend="3 baru"
          trendUp
          iconBgClass="bg-green-50"
          iconTextClass="text-green-700"
        />
        <StatCard
          icon="work"
          label="Job Matches"
          value={24}
          trend="12%"
          trendUp
        />
        <StatCard
          icon="description"
          label="Lamaran Aktif"
          value={5}
          iconBgClass="bg-tertiary-fixed"
          iconTextClass="text-tertiary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Job Recommendations */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-xl font-bold text-on-background">
              Rekomendasi Lowongan Terbaru
            </h2>
            <Link
              href="/student/job-matching"
              className="font-label text-sm text-primary hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <Link
                key={job.title}
                href="/jobs/1"
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors group"
              >
                <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center">
                  <Icon name={job.icon} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-on-background group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <p className="font-label text-sm text-on-surface-variant">
                    {job.company} · {job.location} · {job.type}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-label text-xs font-bold ${getMatchBadge(job.match)}`}
                >
                  {job.match}% Match
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Competency Overview */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-lg font-bold text-on-background">
              Mata Kuliah Terbaik
            </h2>
            <Link
              href="/student/profile"
              className="font-label text-sm text-primary hover:underline"
            >
              Detail
            </Link>
          </div>
          <div className="space-y-5">
            {competencies.map((comp) => {
              const grade = getGrade(comp.level);
              return (
                <div key={comp.name} className="flex justify-between items-center">
                  <span className="font-label text-sm text-on-surface-variant">
                    {comp.name}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-label text-xs font-bold ${grade.bg} ${grade.text}`}
                  >
                    {grade.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-xl font-bold text-on-background">
            Lamaran Terbaru
          </h2>
          <Link
            href="/student/applications"
            className="font-label text-sm text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Posisi</TableHead>
              <TableHead>Perusahaan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-body text-sm text-on-background">
                Frontend Developer
              </TableCell>
              <TableCell className="font-body text-sm text-on-surface-variant">
                TechIndo
              </TableCell>
              <TableCell className="font-label text-sm text-on-surface-variant">
                10 Mei 2026
              </TableCell>
              <TableCell>
                <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-container rounded-full font-label text-xs font-semibold">
                  Dalam Review
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-body text-sm text-on-background">
                Data Analyst
              </TableCell>
              <TableCell className="font-body text-sm text-on-surface-variant">
                DataCorp
              </TableCell>
              <TableCell className="font-label text-sm text-on-surface-variant">
                8 Mei 2026
              </TableCell>
              <TableCell>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-label text-xs font-semibold">
                  Interview
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-body text-sm text-on-background">
                UI/UX Designer
              </TableCell>
              <TableCell className="font-body text-sm text-on-surface-variant">
                DesignLab
              </TableCell>
              <TableCell className="font-label text-sm text-on-surface-variant">
                5 Mei 2026
              </TableCell>
              <TableCell>
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full font-label text-xs font-semibold">
                  Ditolak
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
