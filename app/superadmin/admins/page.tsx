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
import {
  createAdminUser,
  createProdi,
  softDeleteAdminUser,
  updateAdminUser,
  updateProdi,
  type AdminUserWithProdi,
  type Prodi,
} from "@/lib/supabase/superadmin-queries";
import { useSuperadminData } from "../SuperadminDataProvider";

const INTEGRATION_STATUSES = [
  { value: "planned", label: "Belum Terintegrasi", className: "bg-surface-container text-on-surface-variant" },
  { value: "pending", label: "Dalam Proses", className: "bg-blue-50 text-blue-700" },
  { value: "active", label: "Aktif", className: "bg-green-50 text-green-700" },
] as const;

type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number]["value"];

// ─── ProdiCombobox ────────────────────────────────────────────────────────────

interface ProdiComboboxProps {
  value: string;
  options: Prodi[];
  onSelect: (prodi: Prodi) => void;
  onCreate: (name: string) => Promise<Prodi | null>;
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
    ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.name.toLowerCase() === q.toLowerCase());
  const canCreate = q.length > 0 && !exactMatch;
  const totalItems = filtered.length + (canCreate ? 1 : 0);
  // Clamp during render instead of in an effect: when filtering shrinks the
  // list, the stored highlight may point past the end. Deriving the active
  // index avoids a setState-in-effect cascading render.
  const activeIndex = highlight >= totalItems ? Math.max(0, totalItems - 1) : highlight;

  const commitSelect = (prodi: Prodi) => {
    onSelect(prodi);
    setOpen(false);
    setQuery("");
    setHighlight(0);
  };

  const commitCreate = async () => {
    if (!canCreate) return;
    const created = await onCreate(q);
    if (created) commitSelect(created);
  };

  const handleKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(totalItems - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < filtered.length) commitSelect(filtered[activeIndex]);
      else if (canCreate) await commitCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const displayValue = open ? query : value;

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center h-12 w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] ${open ? "ring-2 ring-primary/40 border-ring" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder ?? "Pilih atau ketik prodi"}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent px-3 py-2 outline-none font-body text-sm text-on-background placeholder:text-outline min-w-0"
        />
        <button type="button" tabIndex={-1} onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
          className="px-2 text-on-surface-variant">
          <Icon name={open ? "expand_less" : "expand_more"} size={20} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 && !canCreate && (
            <p className="px-3 py-3 font-body text-sm text-on-surface-variant text-center">Tidak ada hasil.</p>
          )}
          {filtered.map((opt, idx) => {
            const isHi = idx === activeIndex;
            const isSel = opt.name === value;
            const cls = isSel ? "bg-primary-fixed-dim text-primary font-semibold" : isHi ? "bg-surface-container text-on-background" : "text-on-background";
            return (
              <button key={opt.id} type="button" onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()} onClick={() => commitSelect(opt)}
                className={`w-full px-3 py-2 font-body text-sm text-left ${cls}`}>
                {opt.name}
              </button>
            );
          })}
          {canCreate && (
            <button type="button" onMouseEnter={() => setHighlight(filtered.length)}
              onMouseDown={(e) => e.preventDefault()} onClick={commitCreate}
              className={`w-full text-left px-3 py-2 font-body text-sm flex items-center gap-2 border-t border-outline-variant/30 ${activeIndex === filtered.length ? "bg-primary/10" : ""} text-primary font-semibold`}>
              <Icon name="add" size={16} />
              <span className="truncate">Tambah prodi baru: &ldquo;{q}&rdquo;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface AdminForm {
  name: string;
  email: string;
  password: string;
  prodi_id: string;
  prodiName: string;
}

const emptyForm: AdminForm = { name: "", email: "", password: "", prodi_id: "", prodiName: "" };

export default function ManageAdminsPage() {
  const { admins: adminList, prodis: prodiList, loading } = useSuperadminData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserWithProdi | null>(null);

  const prodiTanpaAdmin = useMemo(
    () => prodiList.filter((p) => !adminList.some((a) => a.prodi_id === p.id)),
    [prodiList, adminList],
  );

  const filtered = adminList.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchProdi = prodiFilter === "all" || a.prodi_id === prodiFilter;
    return matchSearch && matchProdi;
  });

  const openAdd = (presetProdi?: Prodi) => {
    setEditingId(null);
    setForm(presetProdi
      ? { ...emptyForm, prodi_id: presetProdi.id, prodiName: presetProdi.name }
      : emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: AdminUserWithProdi) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      email: "",
      password: "",
      prodi_id: a.prodi_id ?? "",
      prodiName: a.prodi?.name ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleChangeIntegration = async (prodiId: string, status: IntegrationStatus) => {
    try {
      await updateProdi(prodiId, { integration_status: status });
    } catch (e) {
      setError(`Gagal mengubah status integrasi: ${(e as Error).message}`);
    }
  };

  const handleCreateProdi = async (name: string): Promise<Prodi | null> => {
    try {
      return await createProdi({ name, fakultas: null, integration_status: "planned" });
    } catch (e) {
      setError(`Gagal menambah prodi: ${(e as Error).message}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.prodi_id) return;
    if (!editingId) {
      if (!form.email || !form.password) {
        setError("Email dan password wajib diisi untuk admin baru.");
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
        await updateAdminUser(editingId, { name: form.name, prodi_id: form.prodi_id });
      } else {
        await createAdminUser({
          name: form.name,
          email: form.email,
          password: form.password,
          prodi_id: form.prodi_id,
        });
      }
      closeModal();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await softDeleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
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

            {error && (
              <div className="mb-4 px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input required type="text" placeholder="Contoh: Dr. Andi Wibowo, M.Kom." value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
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
                      placeholder="admin.prodi@kampus.ac.id"
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
                      Bagikan kredensial ini ke admin prodi. Mereka bisa ubah password setelah login.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Prodi <span className="text-error">*</span>
                </label>
                <ProdiCombobox
                  value={form.prodiName}
                  options={prodiList}
                  onSelect={(p) => setForm((f) => ({ ...f, prodi_id: p.id, prodiName: p.name }))}
                  onCreate={handleCreateProdi}
                  placeholder="Pilih atau ketik prodi"
                />
                <p className="font-label text-[11px] text-on-surface-variant mt-1 leading-snug">
                  Ketik untuk mencari. Jika prodi belum ada, opsi tambah akan muncul.
                </p>
              </div>
              <div className="flex gap-3 pt-8 mt-2 border-t border-outline-variant/20">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 btn-gradient font-label font-bold rounded-xl py-3 disabled:opacity-60">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Akun"}
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
            Akun <span className="font-bold text-on-background">{deleteTarget?.name}</span>{" "}
            ({deleteTarget?.prodi?.name}) akan dihapus dari sistem.
          </>
        }
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold text-on-background">Kelola Admin Prodi</h1>
            <p className="font-body text-on-surface-variant">
              Provisi akun admin untuk setiap prodi.
            </p>
          </div>
          <button onClick={() => openAdd()}
            className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]">
            <Icon name="person_add" size={20} />Tambah Admin
          </button>
        </div>

        {error && !showModal && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">{error}</div>
        )}

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
                  <button key={p.id} type="button" onClick={() => openAdd(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 rounded-full font-label text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors">
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
            <p className="font-label text-sm text-on-surface-variant">Total Prodi</p>
            <p className="font-headline text-2xl font-bold text-primary">{prodiList.length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Prodi Tercakup</p>
            <p className="font-headline text-2xl font-bold text-green-700">
              {new Set(adminList.map((a) => a.prodi_id).filter(Boolean)).size}
              <span className="font-body text-sm text-on-surface-variant font-medium">/{prodiList.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="text" placeholder="Cari nama admin..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline" />
          </div>
          <Select value={prodiFilter} onValueChange={setProdiFilter}>
            <SelectTrigger className="h-12 lg:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prodi</SelectItem>
              {prodiList.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Nama", "Email", "Prodi", "Status Integrasi", "Aksi"].map((h) => (
                    <th key={h} className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">Memuat data...</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low transition-colors border-t border-surface-variant">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                          <Icon name="person" className="text-primary" size={16} />
                        </div>
                        <span className="font-body text-sm font-medium text-on-background">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant whitespace-nowrap">
                      {a.email ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">
                      {a.prodi?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {a.prodi_id ? (
                        (() => {
                          const current = (a.prodi?.integration_status ?? "planned") as IntegrationStatus;
                          const style = INTEGRATION_STATUSES.find((s) => s.value === current) ?? INTEGRATION_STATUSES[0];
                          return (
                            <Select
                              value={current}
                              onValueChange={(v) => handleChangeIntegration(a.prodi_id!, v as IntegrationStatus)}
                            >
                              <SelectTrigger
                                className={`h-8 w-44 rounded-full border-none font-label text-xs font-semibold ${style.className}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INTEGRATION_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()
                      ) : (
                        <span className="font-label text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
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
                {!loading && filtered.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td colSpan={5} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                      {adminList.length === 0 ? "Belum ada admin." : "Tidak ada yang cocok."}
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
