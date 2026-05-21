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
  updateApplicationStatus,
  type ApplicationStatus,
  type ApplicationWithDetails,
} from "@/lib/supabase/hr-queries";
import { hrDataMutators } from "@/lib/supabase/hrDataStore";
import { reportHrError } from "@/lib/supabase/hrErrors";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useHRData } from "../HRDataProvider";

const statusLabel: Record<ApplicationStatus, string> = {
  new: "Baru",
  reviewed: "Ditinjau",
  interview: "Interview",
  accepted: "Diterima",
  rejected: "Ditolak",
};

const statusColor: Record<ApplicationStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  reviewed: "bg-amber-50 text-amber-700",
  interview: "bg-primary-fixed text-primary",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-error-container text-error",
};

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

  const { jobs, applications, prodiNames, loading, error } = useHRData();

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<string>(initialJobFilter);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ApplicationWithDetails | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter((a) => {
      const studentName = a.students?.name ?? "";
      const jobTitle = a.jobs?.title ?? "";
      const matchesSearch =
        !q ||
        studentName.toLowerCase().includes(q) ||
        jobTitle.toLowerCase().includes(q);
      const matchesJob = jobFilter === "all" || a.job_id === jobFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesJob && matchesStatus;
    });
  }, [applications, search, jobFilter, statusFilter]);

  const updateStatus = async (id: string, newStatus: ApplicationStatus) => {
    setBusy(true);
    setActionError(null);
    try {
      await updateApplicationStatus(id, newStatus);
      hrDataMutators.setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
      setSelected((s) => (s && s.id === id ? { ...s, status: newStatus } : s));
    } catch (e) {
      setActionError(reportHrError(e, "applicants.updateStatus"));
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: applications.length,
      new: applications.filter((a) => a.status === "new").length,
      interview: applications.filter((a) => a.status === "interview").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
    }),
    [applications],
  );

  return (
    <>
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-background">
                Detail Pelamar
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-fixed rounded-2xl flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-primary" size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline text-lg font-bold text-on-background">
                    {selected.students?.name ?? "—"}
                  </h3>
                  <p className="font-label text-sm text-on-surface-variant">
                    NIM {selected.students?.nim ?? "—"} • Angkatan{" "}
                    {selected.students?.angkatan ?? "—"}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant mt-0.5">
                    {selected.students?.prodi_id
                      ? prodiNames[selected.students.prodi_id] ?? "—"
                      : "—"}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
                  {actionError}
                </div>
              )}

              <div className="p-4 bg-surface-container-low rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="font-label text-sm text-on-surface-variant">
                    Posisi
                  </span>
                  <span className="font-label text-sm font-semibold text-on-background">
                    {selected.jobs?.title ?? "—"}
                  </span>
                </div>
                {selected.match_score !== null && selected.match_score !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-label text-sm text-on-surface-variant">
                      Match Score
                    </span>
                    <span className="font-label text-sm font-bold text-primary">
                      {Math.round((selected.match_score ?? 0) * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-label text-sm text-on-surface-variant">
                    Tanggal Melamar
                  </span>
                  <span className="font-label text-sm text-on-background">
                    {selected.applied_at
                      ? new Date(selected.applied_at).toLocaleDateString("id-ID")
                      : "—"}
                  </span>
                </div>
                {selected.students?.email && (
                  <div className="flex justify-between">
                    <span className="font-label text-sm text-on-surface-variant">
                      Email
                    </span>
                    <span className="font-label text-sm text-on-background truncate ml-3">
                      {selected.students.email}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-label text-sm text-on-surface-variant mb-2">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusLabel) as ApplicationStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`font-label text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 ${selected.status === s ? statusColor[s] : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Pelamar
          </h1>
          <p className="font-body text-on-surface-variant">
            Kelola dan tinjau pelamar lowongan.
          </p>
        </div>

        {(error || actionError) && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {actionError ?? error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Pelamar", value: stats.total, color: "text-on-background" },
            { label: "Baru", value: stats.new, color: "text-blue-700" },
            { label: "Interview", value: stats.interview, color: "text-primary" },
            { label: "Diterima", value: stats.accepted, color: "text-green-700" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border"
            >
              <p className="font-label text-sm text-on-surface-variant">{s.label}</p>
              <p className={`font-headline text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari nama pelamar atau posisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="h-12 lg:min-w-44 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lowongan</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 lg:min-w-36 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {(Object.keys(statusLabel) as ApplicationStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Pelamar", "Posisi", "Match Score", "Tanggal", "Status", "Aksi"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && applications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center">
                            <Icon name="person" className="text-primary" size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-sm font-medium text-on-background">
                              {a.students?.name ?? "—"}
                            </p>
                            <p className="font-label text-xs text-on-surface-variant">
                              NIM {a.students?.nim ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-on-background">
                        {a.jobs?.title ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {a.match_score !== null && a.match_score !== undefined ? (
                          <span className="font-label text-sm font-bold text-primary">
                            {Math.round((a.match_score ?? 0) * 100)}%
                          </span>
                        ) : (
                          <span className="font-label text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                        {a.applied_at
                          ? new Date(a.applied_at).toLocaleDateString("id-ID")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-label text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[a.status as ApplicationStatus] ?? ""}`}
                        >
                          {statusLabel[a.status as ApplicationStatus] ?? a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelected(a)}
                          className="px-3 py-1.5 font-label text-xs font-bold text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Detail
                          <Icon name="arrow_forward" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                    >
                      {applications.length === 0
                        ? "Belum ada pelamar."
                        : "Tidak ada yang cocok dengan filter."}
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
