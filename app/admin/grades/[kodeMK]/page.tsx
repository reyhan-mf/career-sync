"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminProfile,
  angkatanOptions,
  gradeColor,
  gradeOptions,
  getMataKuliahByKode,
  initialCLOs,
  initialGrades,
  initialMahasiswa,
  semesterOptions,
  type GradeItem,
} from "@/lib/admin-mock";

interface CellTarget {
  nim: string;
  cloId: string;
  existing: GradeItem | null;
}

interface GradeForm {
  grade: string;
  score: string;
  semester: string;
}

const emptyForm: GradeForm = { grade: "", score: "", semester: "" };

type StatusKey = "lengkap" | "sebagian" | "belum";

function statusBadge(s: StatusKey) {
  if (s === "lengkap") return { bg: "bg-green-50", text: "text-green-700", label: "Lengkap" };
  if (s === "sebagian") return { bg: "bg-blue-50", text: "text-blue-700", label: "Sebagian" };
  return { bg: "bg-tertiary-fixed", text: "text-on-tertiary-container", label: "Belum" };
}

export default function MKGradesMatrixPage() {
  const params = useParams<{ kodeMK: string }>();
  const mk = getMataKuliahByKode(params.kodeMK);

  const mkClos = useMemo(
    () => (mk ? initialCLOs.filter((c) => c.mataKuliah === mk.nama) : []),
    [mk]
  );
  const initialForMK = useMemo(
    () => (mk ? initialGrades.filter((g) => g.mataKuliah === mk.nama) : []),
    [mk]
  );

  const [grades, setGrades] = useState<GradeItem[]>(initialForMK);
  const [search, setSearch] = useState("");
  const [angkatanFilter, setAngkatanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [target, setTarget] = useState<CellTarget | null>(null);
  const [form, setForm] = useState<GradeForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<GradeItem | null>(null);

  // Map nim -> cloId -> grade
  const gradeMap = useMemo(() => {
    const map = new Map<string, Map<string, GradeItem>>();
    grades.forEach((g) => {
      const inner = map.get(g.nim) ?? new Map<string, GradeItem>();
      inner.set(g.clo, g);
      map.set(g.nim, inner);
    });
    return map;
  }, [grades]);

  const rows = useMemo(() => {
    return initialMahasiswa.map((m) => {
      const gradedClos = gradeMap.get(m.nim) ?? new Map();
      const dinilaiCount = gradedClos.size;
      const totalClos = mkClos.length;
      let status: StatusKey = "belum";
      if (totalClos > 0 && dinilaiCount === totalClos) status = "lengkap";
      else if (dinilaiCount > 0) status = "sebagian";
      return { mahasiswa: m, gradedClos, dinilaiCount, totalClos, status };
    });
  }, [gradeMap, mkClos]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.mahasiswa.name.toLowerCase().includes(search.toLowerCase()) ||
        r.mahasiswa.nim.includes(search);
      const matchAngkatan = angkatanFilter === "all" || r.mahasiswa.angkatan === angkatanFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchAngkatan && matchStatus;
    });
  }, [rows, search, angkatanFilter, statusFilter]);

  const stats = useMemo(() => {
    const dinilai = rows.filter((r) => r.status !== "belum").length;
    const lengkap = rows.filter((r) => r.status === "lengkap").length;
    const belum = rows.filter((r) => r.status === "belum").length;
    const avg = grades.length ? grades.reduce((s, g) => s + g.score, 0) / grades.length : null;
    return {
      total: rows.length,
      dinilai,
      lengkap,
      belum,
      avg: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  }, [rows, grades]);

  if (!mk) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="search_off" size={48} className="text-on-surface-variant mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Mata Kuliah tidak ditemukan</h1>
        <p className="font-body text-on-surface-variant mb-6">Kode {params.kodeMK?.toUpperCase()} tidak terdaftar.</p>
        <Link href="/admin/grades" className="btn-gradient font-label font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2">
          <Icon name="arrow_back" size={18} /> Kembali ke Daftar Mata Kuliah
        </Link>
      </div>
    );
  }

  const openCell = (nim: string, cloId: string) => {
    const existing = gradeMap.get(nim)?.get(cloId) ?? null;
    setTarget({ nim, cloId, existing });
    setForm(existing
      ? { grade: existing.grade, score: String(existing.score), semester: existing.semester }
      : emptyForm);
  };

  const closeModal = () => {
    setTarget(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !form.grade || !form.score || !form.semester) return;
    const score = parseInt(form.score);
    const mhs = initialMahasiswa.find((m) => m.nim === target.nim);
    if (!mhs) return;

    if (target.existing) {
      setGrades(grades.map((g) =>
        g.id === target.existing!.id
          ? { ...g, grade: form.grade, score, semester: form.semester }
          : g
      ));
    } else {
      setGrades([...grades, {
        id: Math.max(0, ...grades.map((g) => g.id)) + 1,
        nim: target.nim,
        name: mhs.name,
        mataKuliah: mk.nama,
        clo: target.cloId,
        grade: form.grade,
        score,
        semester: form.semester,
      }]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setGrades(grades.filter((g) => g.id !== deleteTarget.id));
    setDeleteTarget(null);
    setTarget(null);
  };

  const inputCls = "w-full bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";

  const targetMhs = target ? initialMahasiswa.find((m) => m.nim === target.nim) : null;
  const targetClo = target ? mkClos.find((c) => c.id === target.cloId) : null;

  return (
    <>
      {target && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-background">
                {target.existing ? "Edit Nilai" : "Tambah Nilai"}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="mb-5 space-y-2">
              <div className="px-4 py-3 bg-primary-fixed rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/15 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-primary" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-label text-sm font-bold text-on-background truncate">{targetMhs?.name}</p>
                  <p className="font-label text-xs text-on-surface-variant">NIM {targetMhs?.nim} • Angkatan {targetMhs?.angkatan}</p>
                </div>
              </div>
              <div className="px-4 py-3 bg-surface-container-low rounded-xl flex items-start gap-3">
                <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="school" className="text-on-tertiary-container" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-label text-sm font-bold text-primary truncate">{target.cloId}</p>
                  <p className="font-label text-xs text-on-surface-variant line-clamp-2">{targetClo?.deskripsi}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Grade <span className="text-error">*</span>
                  </label>
                  <Select value={form.grade || undefined} onValueChange={(v) => setForm({ ...form, grade: v })}>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Skor (0–100) <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    placeholder="85"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Semester <span className="text-error">*</span>
                </label>
                <Select value={form.semester || undefined} onValueChange={(v) => setForm({ ...form, semester: v })}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                {target.existing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(target.existing);
                    }}
                    className="px-4 py-3 rounded-xl border border-error/30 font-label text-sm font-semibold text-error hover:bg-error-container transition-colors inline-flex items-center gap-1.5"
                  >
                    <Icon name="delete" size={16} /> Hapus
                  </button>
                )}
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 btn-gradient font-label font-bold rounded-xl py-3">
                  {target.existing ? "Simpan" : "Tambah Nilai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Nilai?"
        description={
          <>
            Nilai <span className="font-bold text-on-background">{deleteTarget?.clo}</span> untuk {deleteTarget?.name} akan dihapus.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link href="/admin/grades" className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="arrow_back" size={16} /> Kembali ke Daftar Mata Kuliah
          </Link>
        </div>

        {/* MK Header Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="grade" className="text-primary" size={28} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-label text-xs font-bold text-primary px-2.5 py-1 bg-primary-fixed rounded">{mk.kode}</span>
                  <span className="font-label text-xs text-on-surface-variant">{mk.sks} SKS • Semester {mk.semester}</span>
                </div>
                <h1 className="font-headline text-2xl font-bold text-on-background mb-1">Penilaian: {mk.nama}</h1>
                <p className="font-body text-sm text-on-surface-variant">Prodi {adminProfile.prodi}</p>
              </div>
            </div>
            <Link
              href={`/admin/clo/${mk.kode.toLowerCase()}`}
              className="group font-label font-semibold rounded-xl px-5 py-2.5 flex items-center gap-2 w-fit border border-outline-variant/40 text-on-background hover:bg-surface-container transition-colors text-sm shrink-0"
            >
              <Icon name="school" size={18} className="text-primary" />
              Lihat CLO
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-outline-variant/20">
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Mahasiswa</p>
              <p className="font-headline text-xl font-bold text-on-background mt-1">{stats.total}</p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">CLO</p>
              <p className="font-headline text-xl font-bold text-on-background mt-1">{mkClos.length}</p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Dinilai</p>
              <p className="font-headline text-xl font-bold text-blue-700 mt-1">{stats.dinilai}<span className="text-sm text-on-surface-variant font-normal">/{stats.total}</span></p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Lengkap</p>
              <p className="font-headline text-xl font-bold text-green-700 mt-1">{stats.lengkap}<span className="text-sm text-on-surface-variant font-normal">/{stats.total}</span></p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Rata-rata</p>
              <p className="font-headline text-xl font-bold text-primary mt-1">{stats.avg ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Empty state if no CLO */}
        {mkClos.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-ambient ghost-border text-center">
            <Icon name="school" size={40} className="text-on-surface-variant mx-auto mb-3" />
            <h3 className="font-headline text-lg font-bold text-on-background mb-2">Belum ada CLO</h3>
            <p className="font-body text-sm text-on-surface-variant mb-5">
              Mata kuliah ini belum memiliki Course Learning Outcomes. Tambahkan CLO terlebih dahulu sebelum menilai mahasiswa.
            </p>
            <Link href={`/admin/clo/${mk.kode.toLowerCase()}`} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2">
              <Icon name="add" size={18} /> Kelola CLO
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Cari NIM atau nama mahasiswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 lg:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lengkap">Lengkap</SelectItem>
                    <SelectItem value="sebagian">Sebagian</SelectItem>
                    <SelectItem value="belum">Belum Dinilai</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={angkatanFilter} onValueChange={setAngkatanFilter}>
                  <SelectTrigger className="h-12 lg:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Angkatan</SelectItem>
                    {angkatanOptions.map((a) => (
                      <SelectItem key={a} value={a}>Angkatan {a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left sticky left-0 bg-surface-container-low z-10">NIM</th>
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left">Mahasiswa</th>
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left">Status</th>
                      {mkClos.map((c) => (
                        <th key={c.id} className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-center min-w-[7rem]" title={c.deskripsi}>
                          {c.id.replace(`${mk.kode}-`, "")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const badge = statusBadge(r.status);
                      return (
                        <tr key={r.mahasiswa.nim} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-4 py-3 font-label text-sm font-bold text-primary sticky left-0 bg-surface-container-lowest z-10">{r.mahasiswa.nim}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                                <Icon name="person" className="text-primary" size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-body text-sm font-medium text-on-background whitespace-nowrap">{r.mahasiswa.name}</p>
                                <p className="font-label text-[10px] text-on-surface-variant">Angkatan {r.mahasiswa.angkatan}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-xs font-semibold ${badge.bg} ${badge.text} whitespace-nowrap`}>
                              {badge.label}
                              <span className="opacity-70">({r.dinilaiCount}/{r.totalClos})</span>
                            </span>
                          </td>
                          {mkClos.map((c) => {
                            const grade = r.gradedClos.get(c.id);
                            return (
                              <td key={c.id} className="px-2 py-3 text-center">
                                {grade ? (
                                  <button
                                    onClick={() => openCell(r.mahasiswa.nim, c.id)}
                                    className="group inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors w-full max-w-[7rem] mx-auto"
                                    title={`Edit nilai ${c.id} untuk ${r.mahasiswa.name}`}
                                  >
                                    <span className={`px-2.5 py-0.5 rounded-full font-label text-xs font-bold ${gradeColor(grade.grade)}`}>
                                      {grade.grade}
                                    </span>
                                    <span className="font-label text-xs text-on-surface-variant group-hover:text-on-background transition-colors">
                                      {grade.score}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openCell(r.mahasiswa.nim, c.id)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-fixed transition-colors mx-auto"
                                    title={`Tambah nilai ${c.id} untuk ${r.mahasiswa.name}`}
                                  >
                                    <Icon name="add" size={16} />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr className="border-t border-outline-variant/10">
                        <td colSpan={3 + mkClos.length} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                          Tidak ada mahasiswa yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-label">Klik sel untuk menambah/mengubah nilai. Sel kosong berarti CLO belum dinilai.</span>
                <span className="font-label hidden sm:block">
                  Menampilkan {filtered.length} dari {rows.length} mahasiswa
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
