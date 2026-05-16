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
  adminProfile,
  angkatanOptions,
  initialMahasiswa,
  type MahasiswaItem,
} from "@/lib/admin-mock";
import React, { useState } from "react";

interface UserForm {
  nim: string;
  nama: string;
  email: string;
  angkatan: string;
  password: string;
  status: "active" | "inactive";
}

const emptyForm: UserForm = {
  nim: "",
  nama: "",
  email: "",
  angkatan: "",
  password: "",
  status: "active",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [angkatanFilter, setAngkatanFilter] = useState("all");
  const [userList, setUserList] = useState<MahasiswaItem[]>(initialMahasiswa);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MahasiswaItem | null>(null);

  const filtered = userList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.nim.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return (
      matchSearch && (angkatanFilter === "all" || u.angkatan === angkatanFilter)
    );
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: MahasiswaItem) => {
    setEditingId(u.id);
    setForm({
      nim: u.nim,
      nama: u.name,
      email: u.email,
      angkatan: u.angkatan,
      password: "",
      status: u.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleNIMChange = (nim: string) => {
    if (editingId) {
      setForm({ ...form, nim });
    } else {
      setForm({ ...form, nim, email: nim ? `${nim}@student.ac.id` : "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nim || !form.nama || !form.angkatan) return;

    const email = form.email || `${form.nim}@student.ac.id`;

    if (editingId) {
      setUserList(
        userList.map((u) =>
          u.id === editingId
            ? {
                ...u,
                nim: form.nim,
                name: form.nama,
                email,
                angkatan: form.angkatan,
                status: form.status,
              }
            : u,
        ),
      );
    } else {
      setUserList([
        ...userList,
        {
          id: Math.max(0, ...userList.map((u) => u.id)) + 1,
          nim: form.nim,
          name: form.nama,
          email,
          angkatan: form.angkatan,
          status: form.status,
          lastLogin: "-",
        },
      ]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUserList(userList.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
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
            <div className="mb-4 px-4 py-3 bg-primary-fixed rounded-xl flex items-center gap-2">
              <Icon name="school" size={16} className="text-primary" />
              <p className="font-label text-sm text-primary font-semibold">
                Prodi {adminProfile.prodi}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Auto-generate dari NIM"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
                <p className="font-label text-xs text-on-surface-variant mt-1">
                  Otomatis terisi dari NIM jika dibiarkan kosong.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Angkatan <span className="text-error">*</span>
                  </label>
                  <Select
                    value={form.angkatan || undefined}
                    onValueChange={(v) => setForm({ ...form, angkatan: v })}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {angkatanOptions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
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
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as "active" | "inactive" })
                    }
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
              {!editingId && (
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Password Awal <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Min. 8 karakter"
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputCls}
                  />
                  <p className="font-label text-xs text-on-surface-variant mt-1">
                    Mahasiswa dapat mengganti password setelah login pertama.
                  </p>
                </div>
              )}
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
                  className="flex-1 btn-gradient font-label font-bold rounded-xl py-3"
                >
                  {editingId ? "Simpan Perubahan" : "Tambahkan"}
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
            <span className="font-bold text-on-background">
              {deleteTarget?.name}
            </span>{" "}
            (NIM {deleteTarget?.nim}) akan dihapus dari sistem. Tindakan ini
            tidak dapat dibatalkan.
          </>
        }
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
              Kelola akun mahasiswa Prodi {adminProfile.prodi}.
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Total Mahasiswa
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {userList.length}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Akun Aktif
            </p>
            <p className="font-headline text-2xl font-bold text-green-700">
              {userList.filter((u) => u.status === "active").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">
              Akun Nonaktif
            </p>
            <p className="font-headline text-2xl font-bold text-on-surface-variant">
              {userList.filter((u) => u.status === "inactive").length}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
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
                <SelectItem key={a} value={a}>
                  Angkatan {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    "NIM",
                    "Nama",
                    "Angkatan",
                    "Email",
                    "Status",
                    "Login Terakhir",
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
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-container-low transition-colors border-t border-surface-variant"
                  >
                    <td className="px-6 py-4 font-label text-sm font-bold text-primary">
                      {u.nim}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center">
                          <Icon
                            name="person"
                            className="text-primary"
                            size={16}
                          />
                        </div>
                        <span className="font-body text-sm font-medium text-on-background">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {u.angkatan}
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-label text-xs ${u.status === "active" ? "text-green-700" : "text-on-surface-variant"}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-outline"}`}
                        />
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant">
                      {u.lastLogin}
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
                {filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center font-body text-sm text-on-surface-variant"
                    >
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
