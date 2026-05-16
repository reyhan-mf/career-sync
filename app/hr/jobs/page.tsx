"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
  jobCategoryOptions,
  jobStatusColor,
  jobStatusLabel,
  jobTypeOptions,
  type HRJob,
  type JobStatus,
  type JobType,
} from "@/lib/hr-mock";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";

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

  const [jobs, setJobs] = useState<HRJob[]>(initialHRJobs);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [showModal, setShowModal] = useState(openNewFromUrl);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [newSkill, setNewSkill] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<HRJob | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      const matchesType = typeFilter === "all" || j.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" || j.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [jobs, search, statusFilter, typeFilter, categoryFilter]);

  const activeCount = jobs.filter((j) => j.status === "active").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicants, 0);
  const closingCount = jobs.filter((j) => j.status === "closing").length;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewSkill("");
    setNewQualification("");
    setShowModal(true);
  };

  const openEdit = (j: HRJob) => {
    setEditingId(j.id);
    setForm({
      title: j.title,
      location: j.location,
      type: j.type,
      category: j.category,
      salary: j.salary,
      deadline: j.deadline,
      status: j.status,
      description: j.description,
      qualificationSkills: [...j.qualificationSkills],
      skills: [...j.skills],
    });
    setNewSkill("");
    setNewQualification("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewSkill("");
    setNewQualification("");
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setNewSkill("");
  };

  const addQualification = () => {
    const q = newQualification.trim();
    if (q && !form.qualificationSkills.includes(q)) {
      setForm({
        ...form,
        qualificationSkills: [...form.qualificationSkills, q],
      });
    }
    setNewQualification("");
  };

  const removeSkill = (s: string) =>
    setForm({ ...form, skills: form.skills.filter((x) => x !== s) });

  const removeQualification = (q: string) =>
    setForm({
      ...form,
      qualificationSkills: form.qualificationSkills.filter((x) => x !== q),
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.deadline) return;

    if (editingId) {
      setJobs(
        jobs.map((j) =>
          j.id === editingId
            ? {
                ...j,
                title: form.title,
                location: form.location,
                type: form.type,
                category: form.category,
                salary: form.salary,
                deadline: form.deadline,
                status: form.status,
                description: form.description,
                qualificationSkills: form.qualificationSkills,
                skills: form.skills,
              }
            : j,
        ),
      );
    } else {
      const today = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setJobs([
        ...jobs,
        {
          id: Math.max(0, ...jobs.map((j) => j.id)) + 1,
          title: form.title,
          location: form.location,
          type: form.type,
          category: form.category,
          salary: form.salary,
          applicants: 0,
          deadline: form.deadline,
          status: form.status,
          posted: today,
          description: form.description,
          qualificationSkills: form.qualificationSkills,
          skills: form.skills,
        },
      ]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setJobs(jobs.filter((j) => j.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const inputCls =
    "w-full bg-surface-container-low rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";
  const labelCls =
    "font-label text-xs font-medium text-on-surface-variant mb-1 block";

  return (
    <>
      {/* ─── New / Edit Modal ─── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─ Sticky header ─ */}
            <div className="shrink-0 px-6 pt-5 pb-4 border-b border-outline-variant/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 ${companyProfile.logoBgClass} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <Icon
                      name={companyProfile.logoIcon}
                      className={companyProfile.logoTextClass}
                      size={20}
                      filled
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline text-lg font-bold text-on-background truncate">
                      {editingId ? "Edit Lowongan" : "Tambah Lowongan Baru"}
                    </h2>
                    <p className="font-label text-xs text-on-surface-variant truncate">
                      Untuk {companyProfile.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 p-2 hover:bg-surface-container rounded-lg transition-colors"
                  aria-label="Tutup"
                >
                  <Icon name="close" className="text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* ─ Scrollable body ─ */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>
                  Judul Posisi <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="contoh: Frontend Developer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Lokasi <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="contoh: Jakarta"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Range Gaji</label>
                  <input
                    type="text"
                    placeholder="contoh: Rp 10-18 jt"
                    value={form.salary}
                    onChange={(e) =>
                      setForm({ ...form, salary: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Tipe</label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({ ...form, type: v as JobType })
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Kategori</label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCategoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as JobStatus })
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="closing">Segera Tutup</SelectItem>
                      <SelectItem value="closed">Ditutup</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>
                    Deadline <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="30 Mei 2026"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Deskripsi Pekerjaan</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan deskripsi singkat..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Kualifikasi Skill (untuk matching CLO)
                </label>
                <p className="font-body text-xs text-on-surface-variant mb-2">
                  Setiap kualifikasi akan diproses AI untuk skor CLO via API.
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tambah kualifikasi, lalu Enter..."
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addQualification();
                      }
                    }}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={addQualification}
                    className="btn-gradient rounded-lg px-4 font-label text-sm font-bold shrink-0"
                  >
                    Tambah
                  </button>
                </div>
                <div className="min-h-7">
                  {form.qualificationSkills.length === 0 ? (
                    <p className="font-label text-xs text-outline italic">
                      Belum ada kualifikasi skill.
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {form.qualificationSkills.map((q, idx) => (
                        <li
                          key={q}
                          className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-surface-container-low"
                        >
                          <div className="min-w-0">
                            <p className="font-label text-xs text-on-surface-variant">
                              {idx + 1}.
                            </p>
                            <p className="font-body text-sm text-on-background wrap-break-word">
                              {q}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQualification(q)}
                            className="p-1 text-on-surface-variant hover:text-error"
                            aria-label={`Hapus ${q}`}
                          >
                            <Icon name="close" size={16} />
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Skills yang Dibutuhkan</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tambah skill, lalu Enter..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="btn-gradient rounded-lg px-4 font-label text-sm font-bold shrink-0"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-7">
                  {form.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="hover:text-error"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                  {form.skills.length === 0 && (
                    <p className="font-label text-xs text-outline italic">
                      Belum ada skill ditambahkan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─ Sticky footer ─ */}
            <div className="shrink-0 px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-lowest rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 btn-gradient font-label text-sm font-bold rounded-xl py-2.5 flex items-center justify-center gap-2"
              >
                <Icon name={editingId ? "save" : "publish"} size={16} />
                {editingId ? "Simpan Perubahan" : "Publikasikan Lowongan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Lowongan?"
        description={
          <>
            Lowongan{" "}
            <span className="font-bold text-on-background">
              {deleteTarget?.title}
            </span>{" "}
            akan dihapus permanen.{" "}
            {deleteTarget && deleteTarget.applicants > 0 && (
              <>
                Saat ini ada{" "}
                <span className="font-bold text-on-background">
                  {deleteTarget.applicants} pelamar
                </span>{" "}
                pada lowongan ini.
              </>
            )}
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-headline text-3xl font-bold text-on-background">
              Kelola Lowongan
            </h1>
            <p className="font-body text-on-surface-variant">
              Semua lowongan {companyProfile.name} yang sedang dibuka.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]"
          >
            <Icon name="add" size={20} />
            Tambah Lowongan
          </button>
        </div>

        {/* ─── Mini stats ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Total Lowongan
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {jobs.length}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Aktif Sekarang
            </p>
            <p className="font-headline text-2xl font-bold text-green-700">
              {activeCount}
            </p>
            {closingCount > 0 && (
              <p className="font-label text-xs text-tertiary mt-1">
                {closingCount} segera tutup
              </p>
            )}
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Total Pelamar (semua posisi)
            </p>
            <p className="font-headline text-2xl font-bold text-primary">
              {totalApplicants}
            </p>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Cari posisi atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="closing">Segera Tutup</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-12 lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {jobTypeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-12 lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {jobCategoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ─── Table ─── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    "Posisi",
                    "Lokasi",
                    "Tipe",
                    "Kategori",
                    "Pelamar",
                    "Deadline",
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
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-body text-sm font-medium text-on-background">
                          {job.title}
                        </p>
                        <p className="font-label text-xs text-on-surface-variant mt-0.5">
                          Posted {job.posted}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {job.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container font-label text-xs text-on-surface-variant">
                        {job.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-label text-sm font-bold text-primary">
                        {job.applicants}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {job.deadline}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full font-label text-xs font-semibold ${jobStatusColor[job.status]}`}
                      >
                        {jobStatusLabel[job.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(job)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(job)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                    >
                      Tidak ada lowongan yang cocok dengan filter.
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
