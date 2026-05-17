"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AdminAccount } from "@/lib/admin-mock";
import { useSuperadminData } from "@/app/superadmin/SuperadminDataProvider";

interface ProdiComboboxProps {
  value: string;
  options: string[];
  onSelect: (name: string) => void;
  onCreate: (name: string) => string | null;
  placeholder?: string;
}

function ProdiCombobox({ value, options, onSelect, onCreate, placeholder }: ProdiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const q = query.trim();
  const filtered = q
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.toLowerCase() === q.toLowerCase());
  const canCreate = q.length > 0 && !exactMatch;
  const totalItems = filtered.length + (canCreate ? 1 : 0);

  useEffect(() => {
    if (highlight >= totalItems) setHighlight(Math.max(0, totalItems - 1));
  }, [highlight, totalItems]);

  const commitSelect = (name: string) => {
    onSelect(name);
    setOpen(false);
    setQuery("");
    setHighlight(0);
  };

  const commitCreate = () => {
    if (!canCreate) return;
    const created = onCreate(q);
    if (created) commitSelect(created);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(totalItems - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < filtered.length) {
        commitSelect(filtered[highlight]);
      } else if (canCreate) {
        commitCreate();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  const displayValue = open ? query : value;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center h-12 w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] ${open ? "ring-2 ring-primary/40 border-ring" : ""}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder ?? "Pilih atau ketik prodi"}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent px-3 py-2 outline-none font-body text-sm text-on-background placeholder:text-outline min-w-0"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="px-2 text-on-surface-variant"
          aria-label="Buka daftar prodi"
        >
          <Icon name={open ? "expand_less" : "expand_more"} size={20} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 && !canCreate && (
            <p className="px-3 py-3 font-body text-sm text-on-surface-variant text-center">
              Tidak ada hasil.
            </p>
          )}
          {filtered.map((opt, idx) => {
            const isHi = idx === highlight;
            const isSel = opt === value;
            const cls = isSel
              ? "bg-primary-fixed-dim text-primary font-semibold"
              : isHi
                ? "bg-surface-container text-on-background"
                : "text-on-background";
            return (
              <button
                key={opt}
                type="button"
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitSelect(opt)}
                className={`w-full px-3 py-2 font-body text-sm text-left ${cls}`}
              >
                {opt}
              </button>
            );
          })}
          {canCreate && (
            <button
              type="button"
              onMouseEnter={() => setHighlight(filtered.length)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitCreate}
              className={`w-full text-left px-3 py-2 font-body text-sm flex items-center gap-2 border-t border-outline-variant/30 ${highlight === filtered.length ? "bg-primary/10" : ""} text-primary font-semibold`}
            >
              <Icon name="add" size={16} />
              <span className="truncate">Tambah prodi baru: &ldquo;{q}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
  const { admins: adminList, setAdmins: persist, prodis: prodiList, addProdi } = useSuperadminData();

  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const prodiOptions = prodiList.map((p) => p.name);

  const handleCreateProdi = (name: string): string | null => {
    const entry = addProdi(name);
    return entry ? entry.name : null;
  };

  const prodiTanpaAdmin = useMemo(
    () => prodiList.filter((p) => !adminList.some((a) => a.prodi === p.name)),
    [prodiList, adminList],
  );

  const filtered = adminList.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchProdi = prodiFilter === "all" || a.prodi === prodiFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchProdi && matchStatus;
  });

  const openAdd = (presetProdi?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, prodi: presetProdi ?? "" });
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
      persist(adminList.map((a) =>
        a.id === editingId
          ? { ...a, name: form.name, email: form.email, prodi: form.prodi, status: form.status }
          : a
      ));
    } else {
      persist([...adminList, {
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
    persist(adminList.filter((a) => a.id !== deleteTarget.id));
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
                  <ProdiCombobox
                    value={form.prodi}
                    options={prodiOptions}
                    onSelect={(v) => setForm({ ...form, prodi: v })}
                    onCreate={handleCreateProdi}
                    placeholder="Pilih atau ketik prodi"
                  />
                  <p className="font-label text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Ketik untuk mencari. Jika prodi belum ada, opsi tambah akan muncul.
                  </p>
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
          <button onClick={() => openAdd()} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]">
            <Icon name="person_add" size={20} />Tambah Admin
          </button>
        </div>

        {prodiTanpaAdmin.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Icon name="warning" className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label text-sm font-bold text-amber-900">
                {prodiTanpaAdmin.length} prodi belum punya admin
              </p>
              <p className="font-label text-xs text-amber-800 mt-0.5 mb-2">
                Mahasiswa di prodi berikut belum bisa dilayani sebelum admin dibuat.
              </p>
              <div className="flex flex-wrap gap-2">
                {prodiTanpaAdmin.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => openAdd(p.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 rounded-full font-label text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <Icon name="add" size={12} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              {new Set(adminList.map((a) => a.prodi)).size}<span className="font-body text-sm text-on-surface-variant font-medium">/{prodiList.length}</span>
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
