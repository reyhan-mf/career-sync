"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  adminProfile,
  getMataKuliahByKode,
  initialCLOs,
  type CLOItem,
} from "@/lib/admin-mock";

interface CLOForm {
  id: string;
  deskripsi: string;
}

const emptyForm: CLOForm = { id: "", deskripsi: "" };

export default function MataKuliahCLOPage() {
  const params = useParams<{ kodeMK: string }>();
  const mk = getMataKuliahByKode(params.kodeMK);

  const initialForMK = useMemo(
    () => (mk ? initialCLOs.filter((c) => c.mataKuliah === mk.nama) : []),
    [mk]
  );

  const [cloList, setCloList] = useState<CLOItem[]>(initialForMK);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CLOForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CLOItem | null>(null);

  if (!mk) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <Icon name="search_off" size={48} className="text-on-surface-variant mx-auto mb-4" />
        <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Mata Kuliah tidak ditemukan</h1>
        <p className="font-body text-on-surface-variant mb-6">Kode {params.kodeMK?.toUpperCase()} tidak terdaftar.</p>
        <Link href="/admin/clo" className="btn-gradient font-label font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2">
          <Icon name="arrow_back" size={18} /> Kembali ke Daftar Mata Kuliah
        </Link>
      </div>
    );
  }

  const filtered = cloList.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  const nextCloKode = useMemo(() => {
    const nums = cloList
      .map((c) => parseInt(c.id.split("-").pop() ?? "0"))
      .filter((n) => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${mk.kode}-CLO-${String(next).padStart(2, "0")}`;
  }, [cloList, mk]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, id: nextCloKode });
    setShowModal(true);
  };

  const openEdit = (c: CLOItem) => {
    setEditingId(c.id);
    setForm({ id: c.id, deskripsi: c.deskripsi });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.deskripsi) return;

    const next: CLOItem = {
      id: form.id,
      deskripsi: form.deskripsi,
      mataKuliah: mk.nama,
    };

    if (editingId) {
      setCloList(cloList.map((c) => (c.id === editingId ? next : c)));
    } else {
      setCloList([...cloList, next]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCloList(cloList.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const inputCls = "w-full bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-background">
                {editingId ? "Edit CLO" : "Tambah CLO"}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="mb-5 px-4 py-3 bg-primary-fixed rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/15 rounded-lg flex items-center justify-center">
                <Icon name="menu_book" className="text-primary" size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-label text-sm font-bold text-on-background truncate">{mk.nama}</p>
                <p className="font-label text-xs text-on-surface-variant">{mk.kode} • {mk.sks} SKS • Semester {mk.semester}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Kode CLO <span className="text-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className={inputCls}
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                  Deskripsi CLO <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mampu ..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 btn-gradient font-label font-bold rounded-xl py-3">
                  {editingId ? "Simpan Perubahan" : "Simpan CLO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus CLO?"
        description={
          <>
            CLO <span className="font-bold text-on-background">{deleteTarget?.id}</span> akan dihapus dari mata kuliah ini.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/admin/clo" className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="arrow_back" size={16} /> Kembali ke Daftar Mata Kuliah
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="menu_book" className="text-primary" size={28} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-label text-xs font-bold text-primary px-2.5 py-1 bg-primary-fixed rounded">{mk.kode}</span>
                  <span className="font-label text-xs text-on-surface-variant">{mk.sks} SKS • Semester {mk.semester}</span>
                </div>
                <h1 className="font-headline text-2xl font-bold text-on-background mb-1">{mk.nama}</h1>
                <p className="font-body text-sm text-on-surface-variant">{mk.deskripsi || "Tidak ada deskripsi."}</p>
                <p className="font-label text-xs text-on-surface-variant mt-2">Prodi {adminProfile.prodi}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <button onClick={openAdd} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]">
                <Icon name="add" size={20} />Tambah CLO
              </button>
              <Link
                href={`/admin/grades/${mk.kode.toLowerCase()}`}
                className="group font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit border border-outline-variant/40 text-on-background hover:bg-surface-container transition-colors"
              >
                <Icon name="grade" size={20} className="text-primary" />
                Kelola Nilai
                <Icon name="arrow_forward" size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-outline-variant/20">
            <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Total CLO</p>
            <p className="font-headline text-3xl font-bold text-primary mt-1">{cloList.length}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border">
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari CLO berdasarkan kode atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Icon name={cloList.length === 0 ? "school" : "search_off"} size={40} className="text-on-surface-variant mx-auto mb-3" />
              <h3 className="font-headline text-lg font-bold text-on-background mb-2">
                {cloList.length === 0 ? "Belum ada CLO" : "Tidak ada hasil"}
              </h3>
              <p className="font-body text-sm text-on-surface-variant mb-5">
                {cloList.length === 0
                  ? "Mulai dengan menambahkan CLO pertama untuk mata kuliah ini."
                  : "Tidak ada CLO yang cocok dengan pencarian."}
              </p>
              {cloList.length === 0 && (
                <button onClick={openAdd} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2">
                  <Icon name="add" size={18} /> Tambah CLO Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low">
                    {["Kode", "Deskripsi CLO", "Aksi"].map((h) => (
                      <th key={h} className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-low transition-colors border-t border-surface-variant">
                      <td className="px-6 py-4"><span className="font-label text-sm font-bold text-primary whitespace-nowrap">{c.id}</span></td>
                      <td className="px-6 py-4 font-body text-sm text-on-background">{c.deskripsi}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors">
                            <Icon name="edit" size={18} />
                          </button>
                          <button onClick={() => setDeleteTarget(c)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors">
                            <Icon name="delete" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
