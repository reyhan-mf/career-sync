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
  createStudent,
  deleteStudent,
  updateStudent,
  type Student,
} from "@/lib/supabase/admin-queries";
import { reportAdminError } from "@/lib/supabase/adminErrors";
import { useAdminData } from "../AdminDataProvider";
import React, { useState } from "react";

const angkatanOptions = Array.from({ length: 10 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

interface UserForm {
  nim: string;
  nama: string;
  email: string;
  password: string;
  angkatan: string;
  status: "active" | "inactive";
}

const emptyForm: UserForm = {
  nim: "",
  nama: "",
  email: "",
  password: "",
  angkatan: "",
  status: "active",
};

export default function UsersPage() {
  const {
    adminCtx,
    students: userList,
    loading,
    error: dataError,
    setStudents: setUserList,
  } = useAdminData();
  const [search, setSearch] = useState("");
  const [angkatanFilter, setAngkatanFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const setError = setFormError;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const error = formError ?? dataError;

  const filtered = userList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.nim.includes(search);
    const matchAngkatan =
      angkatanFilter === "all" || String(u.angkatan) === angkatanFilter;
    return matchSearch && matchAngkatan;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: Student) => {
    setEditingId(u.id);
    setForm({
      nim: u.nim,
      nama: u.name,
      email: u.email ?? "",
      password: "",
      angkatan: u.angkatan ? String(u.angkatan) : "",
      status: (u.status as "active" | "inactive") ?? "active",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleNIMChange = (nim: string) => {
    setForm((f) => ({ ...f, nim }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nim || !form.nama || !form.angkatan) return;
    if (!editingId) {
      if (!form.email || !form.password) {
        setError("Email dan password wajib diisi untuk mahasiswa baru.");
        return;
      }
      if (form.password.length < 8) {
        setError("Password minimal 8 karakter.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await updateStudent(editingId, {
          nim: form.nim,
          name: form.nama,
          angkatan: parseInt(form.angkatan),
          status: form.status,
        });
        setUserList((list) => list.map((u) => (u.id === editingId ? updated : u)));
      } else {
        if (!adminCtx) {
          setError("Akun admin belum ditautkan ke prodi. Hubungi superadmin.");
          return;
        }
        const created = await createStudent({
          nim: form.nim,
          name: form.nama,
          email: form.email,
          password: form.password,
          angkatan: parseInt(form.angkatan),
          status: form.status,
          prodi_id: adminCtx.prodi_id,
        });
        // Idempotent: realtime INSERT may have already appended this row by
        // the time the edge function returns. Skip if id is already present.
        setUserList((list) => (list.some((u) => u.id === created.id) ? list : [...list, created]));
      }
      closeModal();
    } catch (e) {
      setError(reportAdminError(e, editingId ? "updateStudent" : "createStudent"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStudent(deleteTarget.id);
      setUserList((list) => list.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(reportAdminError(e, "deleteStudent"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-on-background">
                {editingId ? "Edit Mahasiswa" : "Tambah Mahasiswa"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  NIM <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: 24001"
                  value={form.nim}
                  onChange={(e) => handleNIMChange(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nama sesuai KTP"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {!editingId && (
                <>
                  <div>
                    <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                      Email Login <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      autoComplete="off"
                      placeholder="24001@kampus.ac.id"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                      Password <span className="text-error">*</span>
                    </label>
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Minimal 8 karakter"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className={inputCls}
                    />
                    <p className="font-label text-[11px] text-on-surface-variant mt-1 leading-snug">
                      Bagikan kredensial ini ke mahasiswa. Mereka bisa ubah password setelah login.
                    </p>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Angkatan <span className="text-error">*</span>
                  </label>
                  <Select
                    value={form.angkatan || undefined}
                    onValueChange={(v) => setForm((f) => ({ ...f, angkatan: v }))}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {angkatanOptions.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Status
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Mahasiswa?"
        description={
          <>
            Akun{" "}
            <span className="font-bold text-on-background">{deleteTarget?.name}</span>{" "}
            (NIM {deleteTarget?.nim}) akan dihapus dari sistem. Tindakan ini tidak dapat
            dibatalkan.
          </>
        }
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold text-on-background">
              Manajemen Mahasiswa
            </h1>
            <p className="font-body text-on-surface-variant">
              {adminCtx ? `Kelola akun mahasiswa Prodi ${adminCtx.prodi_name}.` : "Kelola akun mahasiswa program studi."}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]"
          >
            <Icon name="person_add" size={20} />
            Tambah Mahasiswa
          </button>
        </div>

        {error && !showModal && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Total Mahasiswa</p>
            <p className="font-headline text-2xl font-bold text-on-background">{userList.length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Akun Aktif</p>
            <p className="font-headline text-2xl font-bold text-green-700">
              {userList.filter((u) => u.status === "active").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Akun Nonaktif</p>
            <p className="font-headline text-2xl font-bold text-on-surface-variant">
              {userList.filter((u) => u.status === "inactive").length}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col sm:flex-row gap-3">
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
          <Select value={angkatanFilter} onValueChange={setAngkatanFilter}>
            <SelectTrigger className="h-12 sm:w-48">
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

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["NIM", "Nama", "Email", "Angkatan", "Status", "Aksi"].map((h) => (
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                      Memuat data...
                    </td>
                  </tr>
                ) : filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                  >
                    <td className="px-6 py-4 font-label text-sm font-bold text-primary">{u.nim}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center">
                          <Icon name="person" className="text-primary" size={16} />
                        </div>
                        <span className="font-body text-sm font-medium text-on-background">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant whitespace-nowrap">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {u.angkatan ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-label text-xs ${u.status === "active" ? "text-green-700" : "text-on-surface-variant"}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-outline"}`} />
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td colSpan={6} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                      Tidak ada mahasiswa yang cocok dengan filter.
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
