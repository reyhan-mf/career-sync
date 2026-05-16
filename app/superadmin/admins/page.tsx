"use client";

import React, { useState } from "react";
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
  initialAdminAccounts,
  prodiIntegrationStatus,
  type AdminAccount,
} from "@/lib/admin-mock";

const prodiOptions = prodiIntegrationStatus.map((p) => p.name);

interface AdminForm {
  name: string;
  email: string;
  prodi: string;
  status: "active" | "inactive";
  password: string;
}

const emptyForm: AdminForm = { name: "", email: "", prodi: "", status: "active", password: "" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ManageAdminsPage() {
  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminList, setAdminList] = useState<AdminAccount[]>(initialAdminAccounts);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const filtered = adminList.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchProdi = prodiFilter === "all" || a.prodi === prodiFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchProdi && matchStatus;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: AdminAccount) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      email: a.email,
      prodi: a.prodi,
      status: a.status,
      password: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.prodi) return;
    if (!editingId && !form.password) return;

    if (editingId) {
      setAdminList(adminList.map((a) =>
        a.id === editingId
          ? { ...a, name: form.name, email: form.email, prodi: form.prodi, status: form.status }
          : a
      ));
    } else {
      setAdminList([...adminList, {
        id: Math.max(0, ...adminList.map((a) => a.id)) + 1,
        name: form.name,
        email: form.email,
        prodi: form.prodi,
        status: form.status,
        lastLogin: "Belum pernah",
        dateCreated: todayISO(),
      }]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setAdminList(adminList.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const inputCls = "w-full bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-on-background">
                {editingId ? "Edit Admin" : "Tambah Admin Prodi"}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>
            {!editingId && (
              <div className="mb-5 px-4 py-3 bg-tertiary-fixed rounded-xl flex items-start gap-3">
                <Icon name="info" size={18} className="text-on-tertiary-container shrink-0 mt-0.5" />
                <p className="font-label text-xs text-on-tertiary-container leading-relaxed">
                  Akun admin baru akan menerima email dengan kredensial awal. Admin tidak dapat mendaftar mandiri (mengikuti prinsip SSO institusional).
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Dr. Andi Wibowo, M.Kom."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Email Institusi <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="email"
                  placeholder="nama@univnusantara.ac.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Prodi <span className="text-error">*</span>
                  </label>
                  <Select value={form.prodi || undefined} onValueChange={(v) => setForm({ ...form, prodi: v })}>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Pilih Prodi" />
                    </SelectTrigger>
                    <SelectContent>
                      {prodiOptions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
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
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputCls}
                  />
                  <p className="font-label text-xs text-on-surface-variant mt-1">
                    Admin akan diminta mengganti password setelah login pertama.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 btn-gradient font-label font-bold rounded-xl py-3">
                  {editingId ? "Simpan Perubahan" : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Admin?"
        description={
          <>
            Akun <span className="font-bold text-on-background">{deleteTarget?.name}</span> ({deleteTarget?.prodi}) akan dihapus dari sistem. Mereka tidak dapat lagi mengakses panel admin prodi.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold text-on-background">Kelola Admin Prodi</h1>
            <p className="font-body text-on-surface-variant">
              Provisi akun admin untuk setiap prodi. Admin tidak melakukan registrasi mandiri.
            </p>
          </div>
          <button onClick={openAdd} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]">
            <Icon name="person_add" size={20} />Tambah Admin
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Total Admin</p>
            <p className="font-headline text-2xl font-bold text-on-background">{adminList.length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Admin Aktif</p>
            <p className="font-headline text-2xl font-bold text-green-700">{adminList.filter((a) => a.status === "active").length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Prodi Tercakup</p>
            <p className="font-headline text-2xl font-bold text-primary">
              {new Set(adminList.map((a) => a.prodi)).size}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari nama atau email admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>
          <div className="flex gap-3">
            <Select value={prodiFilter} onValueChange={setProdiFilter}>
              <SelectTrigger className="h-12 lg:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Prodi</SelectItem>
                {prodiOptions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Nama", "Email", "Prodi", "Status", "Login Terakhir", "Dibuat", "Aksi"].map((h) => (
                    <th key={h} className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low transition-colors border-t border-surface-variant">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                          <Icon name="person" className="text-primary" size={16} />
                        </div>
                        <span className="font-body text-sm font-medium text-on-background">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">{a.email}</td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">{a.prodi}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 font-label text-xs ${a.status === "active" ? "text-green-700" : "text-on-surface-variant"}`}>
                        <span className={`w-2 h-2 rounded-full ${a.status === "active" ? "bg-green-500" : "bg-outline"}`} />
                        {a.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">{a.lastLogin}</td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">{a.dateCreated}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors">
                          <Icon name="edit" size={18} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors">
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td colSpan={7} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                      Tidak ada admin yang cocok dengan filter.
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
