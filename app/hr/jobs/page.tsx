"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  type JobStatus,
  type JobType,
  type JobWithSkills,
} from "@/lib/supabase/hr-queries";
import { hrDataMutators } from "@/lib/supabase/hrDataStore";
import { reportHrError } from "@/lib/supabase/hrErrors";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";
import { useHRData } from "../HRDataProvider";

const jobTypeOptions: JobType[] = ["Full-time", "Part-time", "Internship", "Contract"];
const jobCategoryOptions = ["Web", "Data", "Mobile", "DevOps", "Design", "Network", "Lainnya"];

const jobStatusLabel: Record<JobStatus, string> = {
  processing: "Diproses",
  active: "Aktif",
  closing: "Segera Tutup",
  closed: "Ditutup",
  draft: "Draft",
};

const jobStatusColor: Record<JobStatus, string> = {
  processing: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  closing: "bg-amber-50 text-amber-700",
  closed: "bg-surface-container text-on-surface-variant",
  draft: "bg-tertiary-fixed text-on-tertiary-container",
};

interface JobForm {
  title: string;
  location: string;
  type: JobType;
  category: string;
  salary: string;
  deadline: string;
  status: JobStatus;
  description: string;
  qualificationSkills: string[];
  skills: string[];
}

const emptyForm: JobForm = {
  title: "",
  location: "",
  type: "Full-time",
  category: "Web",
  salary: "",
  deadline: "",
  status: "active",
  description: "",
  qualificationSkills: [],
  skills: [],
};

export default function ManageJobsPage() {
  return (
    <Suspense fallback={null}>
      <ManageJobsContent />
    </Suspense>
  );
}

function ManageJobsContent() {
  const searchParams = useSearchParams();
  const openNewFromUrl = searchParams.get("new") === "1";

  const { hr, jobs, applications, loading: storeLoading, error: storeError } = useHRData();

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showModal, setShowModal] = useState(openNewFromUrl);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [newSkill, setNewSkill] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<JobWithSkills | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      const matchesType = typeFilter === "all" || j.job_type === typeFilter;
      const matchesCategory = categoryFilter === "all" || j.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [jobs, search, statusFilter, typeFilter, categoryFilter]);

  const applicantsByJob = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((a) => {
      if (!a.job_id) return;
      map.set(a.job_id, (map.get(a.job_id) ?? 0) + 1);
    });
    return map;
  }, [applications]);

  const activeCount = jobs.filter((j) => j.status === "active").length;
  const totalApplicants = applications.length;
  const closingCount = jobs.filter((j) => j.status === "closing").length;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewSkill("");
    setNewQualification("");
    setActionError(null);
    setShowModal(true);
  };

  const openEdit = (j: JobWithSkills) => {
    setEditingId(j.id);
    setForm({
      title: j.title,
      location: j.location ?? "",
      type: (j.job_type ?? "Full-time") as JobType,
      category: j.category ?? "Web",
      salary: j.salary ?? "",
      deadline: j.deadline ? j.deadline.split("T")[0] : "",
      status: j.status as JobStatus,
      description: j.description ?? "",
      qualificationSkills: [...j.requirements]
        .sort((a, b) => a.position - b.position)
        .map((r) => r.req_text),
      skills: j.job_skills.map((s) => s.skill),
    });
    setNewSkill("");
    setNewQualification("");
    setActionError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewSkill("");
    setNewQualification("");
    setActionError(null);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setNewSkill("");
  };

  const addQualification = () => {
    const q = newQualification.trim();
    if (q && !form.qualificationSkills.includes(q))
      setForm((f) => ({ ...f, qualificationSkills: [...f.qualificationSkills, q] }));
    setNewQualification("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !hr) return;
    setSaving(true);
    setActionError(null);
    try {
      const payload = {
        title: form.title,
        location: form.location,
        job_type: form.type,
        category: form.category,
        salary: form.salary || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        status: form.status,
        description: form.description || null,
        hr_id: hr.id,
        company_id: hr.company_id ?? null,
      };

      if (editingId) {
        await updateJob(editingId, payload, form.skills, form.qualificationSkills);
      } else {
        await createJob(payload, form.skills, form.qualificationSkills);
      }
      const next = await getJobs({ hrId: hr.id });
      hrDataMutators.setJobs(() => next);
      closeModal();
    } catch (e) {
      setActionError(reportHrError(e, "jobs.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setActionError(null);
    const id = deleteTarget.id;
    try {
      await deleteJob(id);
      hrDataMutators.setJobs((prev) => prev.filter((j) => j.id !== id));
      setDeleteTarget(null);
    } catch (e) {
      setActionError(reportHrError(e, "jobs.delete"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-surface-container-low rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";
  const labelCls =
    "font-label text-xs font-medium text-on-surface-variant mb-1 block";

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-6 pt-5 pb-4 border-b border-outline-variant/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline text-lg font-bold text-on-background">
                  {editingId ? "Edit Lowongan" : "Tambah Lowongan Baru"}
                </h2>
                <button type="button" onClick={closeModal} className="shrink-0 p-2 hover:bg-surface-container rounded-lg transition-colors">
                  <Icon name="close" className="text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {actionError && (
                <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{actionError}</div>
              )}

              <div>
                <label className={labelCls}>Judul Posisi <span className="text-error">*</span></label>
                <input required type="text" placeholder="contoh: Frontend Developer" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Lokasi <span className="text-error">*</span></label>
                  <input required type="text" placeholder="contoh: Jakarta" value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Range Gaji</label>
                  <input type="text" placeholder="contoh: Rp 10-18 jt" value={form.salary}
                    onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Tipe</label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as JobType }))}>
                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {jobTypeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Kategori</label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {jobCategoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as JobStatus }))}>
                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="closing">Segera Tutup</SelectItem>
                      <SelectItem value="closed">Ditutup</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Deadline</label>
                  <input type="date" value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Deskripsi Pekerjaan</label>
                <textarea rows={3} placeholder="Tuliskan deskripsi singkat..." value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Tech Skills</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="React, Python..." value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    className={`${inputCls} flex-1`} />
                  <button type="button" onClick={addSkill}
                    className="px-3 py-2 rounded-lg border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                    Tambah
                  </button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 bg-primary-fixed text-primary font-label text-xs font-semibold px-2.5 py-1 rounded-full">
                        {s}
                        <button type="button" onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} className="hover:text-error transition-colors ml-0.5">
                          <Icon name="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Kualifikasi / Kompetensi</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="contoh: Mampu mengelola database relasional" value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQualification(); } }}
                    className={`${inputCls} flex-1`} />
                  <button type="button" onClick={addQualification}
                    className="px-3 py-2 rounded-lg border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                    Tambah
                  </button>
                </div>
                {form.qualificationSkills.length > 0 && (
                  <div className="space-y-1.5">
                    {form.qualificationSkills.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                        <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                        <span className="font-body text-sm text-on-background flex-1">{q}</span>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, qualificationSkills: f.qualificationSkills.filter((x) => x !== q) }))}
                          className="text-on-surface-variant hover:text-error transition-colors shrink-0">
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 px-6 pb-5 pt-4 border-t border-outline-variant/30 flex gap-3">
              <button type="button" onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving || !hr}
                className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 disabled:opacity-60">
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Publikasikan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Lowongan?"
        description={
          <>
            Lowongan <span className="font-bold text-on-background">{deleteTarget?.title}</span> akan dihapus permanen.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-headline text-3xl font-bold text-on-background">Kelola Lowongan</h1>
            <p className="font-body text-on-surface-variant">Buat, edit, dan pantau lowongan kerja.</p>
          </div>
          <button onClick={openAdd} disabled={!hr}
            className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)] disabled:opacity-60">
            <Icon name="add" size={20} /> Tambah Lowongan
          </button>
        </div>

        {(storeError || actionError) && !showModal && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {actionError ?? storeError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Lowongan Aktif</p>
            <p className="font-headline text-2xl font-bold text-green-700">{activeCount}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Total Pelamar</p>
            <p className="font-headline text-2xl font-bold text-on-background">{totalApplicants}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Segera Tutup</p>
            <p className="font-headline text-2xl font-bold text-amber-600">{closingCount}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="text" placeholder="Cari judul atau lokasi..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 lg:min-w-36 w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {(Object.keys(jobStatusLabel) as JobStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{jobStatusLabel[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 lg:min-w-36 w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {jobTypeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-12 lg:min-w-36 w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {jobCategoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {storeLoading && jobs.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-1/2 mb-2" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center">
              <Icon name="work_off" size={40} className="text-on-surface-variant mx-auto mb-3" />
              <p className="font-body text-sm text-on-surface-variant">
                {jobs.length === 0 ? 'Belum ada lowongan. Klik "Tambah Lowongan".' : "Tidak ada yang cocok dengan filter."}
              </p>
            </div>
          ) : filtered.map((j) => (
            <div key={j.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-label text-xs font-semibold px-2.5 py-0.5 rounded-full ${jobStatusColor[j.status as JobStatus] ?? ""}`}>
                      {jobStatusLabel[j.status as JobStatus] ?? j.status}
                    </span>
                    {j.job_type && (
                      <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                        {j.job_type}
                      </span>
                    )}
                    {j.category && (
                      <span className="font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                        {j.category}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-label text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                      <Icon name="group" size={12} />
                      {applicantsByJob.get(j.id) ?? 0} pelamar
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-on-background">{j.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-on-surface-variant">
                    {j.location && (
                      <span className="inline-flex items-center gap-1 font-label text-xs">
                        <Icon name="location_on" size={14} /> {j.location}
                      </span>
                    )}
                    {j.salary && (
                      <span className="inline-flex items-center gap-1 font-label text-xs">
                        <Icon name="payments" size={14} /> {j.salary}
                      </span>
                    )}
                    {j.deadline && (
                      <span className="inline-flex items-center gap-1 font-label text-xs">
                        <Icon name="event" size={14} /> {new Date(j.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  {j.job_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {j.job_skills.slice(0, 5).map((s) => (
                        <span key={s.skill} className="font-label text-xs text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                          {s.skill}
                        </span>
                      ))}
                      {j.job_skills.length > 5 && (
                        <span className="font-label text-xs text-on-surface-variant">+{j.job_skills.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/hr/jobs/${j.id}`}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors">
                    <Icon name="visibility" size={18} />
                  </Link>
                  <button onClick={() => openEdit(j)}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors">
                    <Icon name="edit" size={18} />
                  </button>
                  <button onClick={() => setDeleteTarget(j)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors">
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
