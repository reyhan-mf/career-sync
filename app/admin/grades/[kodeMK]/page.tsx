"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  getCLOsByMatkul,
  getMatkulByKode,
  getStudents,
  getStudentCLOsByMatkul,
  upsertStudentCLO,
  deleteStudentCLO,
  type CLO,
  type Matkul,
  type Student,
  type StudentCLO,
} from "@/lib/supabase/admin-queries";
import { reportAdminError } from "@/lib/supabase/adminErrors";

const gradeOptions = ["A", "AB", "B", "BC", "C", "D", "E"];

const gradeColor = (g: string) => {
  if (g === "A") return "bg-green-100 text-green-800";
  if (g === "AB") return "bg-blue-100 text-blue-700";
  if (g === "B") return "bg-primary-fixed text-primary";
  if (g === "BC") return "bg-tertiary-fixed text-on-tertiary-container";
  if (g === "C") return "bg-amber-100 text-amber-700";
  return "bg-error-container text-error";
};

type StatusKey = "lengkap" | "sebagian" | "belum";

function statusBadge(s: StatusKey) {
  if (s === "lengkap") return { bg: "bg-green-50", text: "text-green-700", label: "Lengkap" };
  if (s === "sebagian") return { bg: "bg-blue-50", text: "text-blue-700", label: "Sebagian" };
  return { bg: "bg-tertiary-fixed", text: "text-on-tertiary-container", label: "Belum" };
}

interface CellTarget {
  studentId: string;
  cloId: string;
  existing: StudentCLO | null;
}

export default function MKGradesMatrixPage() {
  const params = useParams<{ kodeMK: string }>();

  const [mk, setMk] = useState<Matkul | null>(null);
  const [clos, setClos] = useState<CLO[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentCLOs, setStudentCLOs] = useState<StudentCLO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [search, setSearch] = useState("");
  const [angkatanFilter, setAngkatanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [target, setTarget] = useState<CellTarget | null>(null);
  const [gradeForm, setGradeForm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StudentCLO | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMatkulByKode(params.kodeMK)
      .then((matkulData) => {
        if (cancelled) return Promise.reject("cancelled");
        if (!matkulData) { setNotFound(true); setLoading(false); return Promise.reject("notfound"); }
        setMk(matkulData);
        return Promise.all([
          getCLOsByMatkul(matkulData.id),
          getStudents(),
          getStudentCLOsByMatkul(matkulData.id),
        ]);
      })
      .then((results) => {
        if (cancelled || !Array.isArray(results)) return;
        const [closData, studentsData, scData] = results;
        setClos(closData);
        setStudents(studentsData);
        setStudentCLOs(scData);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled && e !== "cancelled" && e !== "notfound") {
          setError(reportAdminError(e, "loadGradesMatrix"));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [params.kodeMK]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, Map<string, StudentCLO>>();
    studentCLOs.forEach((sc) => {
      const inner = map.get(sc.student_id) ?? new Map<string, StudentCLO>();
      inner.set(sc.clo_id, sc);
      map.set(sc.student_id, inner);
    });
    return map;
  }, [studentCLOs]);

  const angkatanOptions = useMemo(
    () => [...new Set(students.map((s) => String(s.angkatan ?? "")).filter(Boolean))].sort(),
    [students],
  );

  const rows = useMemo(() =>
    students.map((s) => {
      const gradedClos = gradeMap.get(s.id) ?? new Map<string, StudentCLO>();
      const dinilaiCount = gradedClos.size;
      const totalClos = clos.length;
      let status: StatusKey = "belum";
      if (totalClos > 0 && dinilaiCount === totalClos) status = "lengkap";
      else if (dinilaiCount > 0) status = "sebagian";
      return { student: s, gradedClos, dinilaiCount, totalClos, status };
    }),
    [students, gradeMap, clos.length],
  );

  const filtered = useMemo(() =>
    rows.filter((r) => {
      const matchSearch =
        r.student.name.toLowerCase().includes(search.toLowerCase()) ||
        r.student.nim.includes(search);
      const matchAngkatan = angkatanFilter === "all" || String(r.student.angkatan) === angkatanFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchAngkatan && matchStatus;
    }),
    [rows, search, angkatanFilter, statusFilter],
  );

  const stats = useMemo(() => {
    const dinilai = rows.filter((r) => r.status !== "belum").length;
    const lengkap = rows.filter((r) => r.status === "lengkap").length;
    return { total: rows.length, dinilai, lengkap };
  }, [rows]);

  const openCell = (studentId: string, cloId: string) => {
    const existing = gradeMap.get(studentId)?.get(cloId) ?? null;
    setTarget({ studentId, cloId, existing });
    setGradeForm(existing?.grade ?? "");
  };

  const closeModal = () => { setTarget(null); setGradeForm(""); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !gradeForm) return;
    setSaving(true);
    setError(null);
    try {
      await upsertStudentCLO(target.studentId, target.cloId, gradeForm);
      const newSC: StudentCLO = { student_id: target.studentId, clo_id: target.cloId, grade: gradeForm };
      setStudentCLOs((prev) => {
        const filtered = prev.filter(
          (sc) => !(sc.student_id === target.studentId && sc.clo_id === target.cloId),
        );
        return [...filtered, newSC];
      });
      closeModal();
    } catch (e) {
      setError(reportAdminError(e, "upsertStudentCLO"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStudentCLO(deleteTarget.student_id, deleteTarget.clo_id);
      setStudentCLOs((prev) =>
        prev.filter(
          (sc) => !(sc.student_id === deleteTarget.student_id && sc.clo_id === deleteTarget.clo_id),
        ),
      );
      setDeleteTarget(null);
      setTarget(null);
    } catch (e) {
      setError(reportAdminError(e, "deleteStudentCLO"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 text-center font-body text-sm text-on-surface-variant">
        Memuat data...
      </div>
    );
  }

  if (notFound || !mk) {
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

  const targetStudent = target ? students.find((s) => s.id === target.studentId) : null;
  const targetClo = target ? clos.find((c) => c.id === target.cloId) : null;

  return (
    <>
      {target && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
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
                  <p className="font-label text-sm font-bold text-on-background truncate">{targetStudent?.name}</p>
                  <p className="font-label text-xs text-on-surface-variant">NIM {targetStudent?.nim} • Angkatan {targetStudent?.angkatan}</p>
                </div>
              </div>
              <div className="px-4 py-3 bg-surface-container-low rounded-xl flex items-start gap-3">
                <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="school" className="text-on-tertiary-container" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-label text-sm font-bold text-primary truncate">{targetClo?.clo_code}</p>
                  <p className="font-label text-xs text-on-surface-variant line-clamp-2">{targetClo?.clo_text}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Grade <span className="text-error">*</span>
                </label>
                <Select value={gradeForm || undefined} onValueChange={setGradeForm}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Pilih Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                {target.existing && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(target.existing)}
                    className="px-4 py-3 rounded-xl border border-error/30 font-label text-sm font-semibold text-error hover:bg-error-container transition-colors inline-flex items-center gap-1.5"
                  >
                    <Icon name="delete" size={16} /> Hapus
                  </button>
                )}
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 disabled:opacity-60">
                  {saving ? "Menyimpan..." : target.existing ? "Simpan" : "Tambah Nilai"}
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
            Nilai CLO <span className="font-bold text-on-background">{clos.find((c) => c.id === deleteTarget?.clo_id)?.clo_code}</span> akan dihapus.
          </>
        }
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link href="/admin/grades" className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="arrow_back" size={16} /> Kembali ke Daftar Mata Kuliah
          </Link>
        </div>

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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-outline-variant/20">
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Mahasiswa</p>
              <p className="font-headline text-xl font-bold text-on-background mt-1">{stats.total}</p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">CLO</p>
              <p className="font-headline text-xl font-bold text-on-background mt-1">{clos.length}</p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Dinilai</p>
              <p className="font-headline text-xl font-bold text-blue-700 mt-1">
                {stats.dinilai}<span className="text-sm text-on-surface-variant font-normal">/{stats.total}</span>
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Lengkap</p>
              <p className="font-headline text-xl font-bold text-green-700 mt-1">
                {stats.lengkap}<span className="text-sm text-on-surface-variant font-normal">/{stats.total}</span>
              </p>
            </div>
          </div>
        </div>

        {clos.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 shadow-ambient ghost-border text-center">
            <Icon name="school" size={40} className="text-on-surface-variant mx-auto mb-3" />
            <h3 className="font-headline text-lg font-bold text-on-background mb-2">Belum ada CLO</h3>
            <p className="font-body text-sm text-on-surface-variant mb-5">
              Tambahkan CLO terlebih dahulu sebelum menilai mahasiswa.
            </p>
            <Link href={`/admin/clo/${mk.kode.toLowerCase()}`} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2">
              <Icon name="add" size={18} /> Kelola CLO
            </Link>
          </div>
        ) : (
          <>
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
                  <SelectTrigger className="h-12 lg:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lengkap">Lengkap</SelectItem>
                    <SelectItem value="sebagian">Sebagian</SelectItem>
                    <SelectItem value="belum">Belum Dinilai</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={angkatanFilter} onValueChange={setAngkatanFilter}>
                  <SelectTrigger className="h-12 lg:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Angkatan</SelectItem>
                    {angkatanOptions.map((a) => (
                      <SelectItem key={a} value={a}>Angkatan {a}</SelectItem>
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
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left sticky left-0 bg-surface-container-low z-10">NIM</th>
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left">Mahasiswa</th>
                      <th className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-left">Status</th>
                      {clos.map((c) => (
                        <th key={c.id} className="font-label text-xs text-on-surface-variant uppercase tracking-wider px-4 py-4 text-center min-w-24" title={c.clo_text}>
                          {(c.clo_code ?? "").replace(`${mk.kode}-`, "")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const badge = statusBadge(r.status);
                      return (
                        <tr key={r.student.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-4 py-3 font-label text-sm font-bold text-primary sticky left-0 bg-surface-container-lowest z-10">{r.student.nim}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                                <Icon name="person" className="text-primary" size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-body text-sm font-medium text-on-background whitespace-nowrap">{r.student.name}</p>
                                <p className="font-label text-[10px] text-on-surface-variant">Angkatan {r.student.angkatan}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-xs font-semibold ${badge.bg} ${badge.text} whitespace-nowrap`}>
                              {badge.label}
                              <span className="opacity-70">({r.dinilaiCount}/{r.totalClos})</span>
                            </span>
                          </td>
                          {clos.map((c) => {
                            const sc = r.gradedClos.get(c.id);
                            return (
                              <td key={c.id} className="px-2 py-3 text-center">
                                {sc ? (
                                  <button
                                    onClick={() => openCell(r.student.id, c.id)}
                                    className="group inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors w-full max-w-24 mx-auto"
                                  >
                                    <span className={`px-2.5 py-0.5 rounded-full font-label text-xs font-bold ${gradeColor(sc.grade ?? "")}`}>
                                      {sc.grade}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openCell(r.student.id, c.id)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-fixed transition-colors mx-auto"
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
                        <td colSpan={3 + clos.length} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                          Tidak ada mahasiswa yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-label">Klik sel untuk menambah/mengubah nilai.</span>
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
