"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  initialMataKuliah,
  initialCLOs,
  adminProfile,
  type MataKuliahItem,
} from "@/lib/admin-mock";

interface MKForm {
  kode: string;
  nama: string;
  sks: string;
  semester: string;
  deskripsi: string;
}

const emptyForm: MKForm = { kode: "", nama: "", sks: "", semester: "", deskripsi: "" };

const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];
const sksOptions = ["1", "2", "3", "4", "5", "6"];

export default function AdminCLOPage() {
  const [search, setSearch] = useState("");
  const [mkList, setMkList] = useState<MataKuliahItem[]>(initialMataKuliah);
  const [showModal, setShowModal] = useState(false);
  const [editingKode, setEditingKode] = useState<string | null>(null);
  const [form, setForm] = useState<MKForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MataKuliahItem | null>(null);

  const filteredMK = mkList.filter(
    (mk) =>
      mk.nama.toLowerCase().includes(search.toLowerCase()) ||
      mk.kode.toLowerCase().includes(search.toLowerCase())
  );

  const totalCLO = initialCLOs.length;

  const openAdd = () => {
    setEditingKode(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (mk: MataKuliahItem) => {
    setEditingKode(mk.kode);
    setForm({
      kode: mk.kode,
      nama: mk.nama,
      sks: String(mk.sks),
      semester: String(mk.semester),
      deskripsi: mk.deskripsi,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingKode(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode || !form.nama || !form.sks || !form.semester) return;

    const next: MataKuliahItem = {
      kode: form.kode.toUpperCase(),
      nama: form.nama,
      sks: parseInt(form.sks),
      semester: parseInt(form.semester),
      deskripsi: form.deskripsi,
    };

    if (editingKode) {
      setMkList(mkList.map((m) => (m.kode === editingKode ? next : m)));
    } else {
      if (mkList.some((m) => m.kode.toLowerCase() === next.kode.toLowerCase())) return;
      setMkList([...mkList, next]);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMkList(mkList.filter((m) => m.kode !== deleteTarget.kode));
    setDeleteTarget(null);
  };

  const inputCls = "w-full bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";

  const cloCountByMK = (nama: string) => initialCLOs.filter((c) => c.mataKuliah === nama).length;

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-background">
                {editingKode ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="mb-5 px-4 py-3 bg-primary-fixed rounded-xl flex items-center gap-2">
              <Icon name="school" size={16} className="text-primary" />
              <p className="font-label text-sm text-primary font-semibold">Prodi {adminProfile.prodi}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Kode <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="PW"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className={inputCls}
                    disabled={!!editingKode}
                    maxLength={6}
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    Nama Mata Kuliah <span className="text-error">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Pemrograman Web"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-sm text-on-surface-variant mb-1.5 block">
                    SKS <span className="text-error">*</span>
                  </label>
                  <Select value={form.sks || undefined} onValueChange={(v) => setForm({ ...form, sks: v })}>
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Pilih SKS" />
                    </SelectTrigger>
                    <SelectContent>
                      {sksOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s} SKS</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <SelectItem key={s} value={s}>Semester {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="font-label text-sm text-on-surface-variant mb-1.5 block">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat mata kuliah..."
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
                  {editingKode ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Mata Kuliah?"
        description={
          <>
            Mata kuliah <span className="font-bold text-on-background">{deleteTarget?.nama}</span> ({deleteTarget?.kode}) beserta semua CLO terkait akan dihapus. Tindakan ini tidak dapat dibatalkan.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-headline text-3xl font-bold text-on-background">Manajemen Mata Kuliah & CLO</h1>
            <p className="font-body text-on-surface-variant">
              Kelola mata kuliah dan definisi Course Learning Outcomes Prodi {adminProfile.prodi}.
            </p>
          </div>
          <button onClick={openAdd} className="btn-gradient font-label font-bold rounded-xl px-6 py-3 flex items-center gap-2 w-fit shadow-[0_4px_14px_rgb(9,76,178,0.25)]">
            <Icon name="add" size={20} />Tambah Mata Kuliah
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Total Mata Kuliah</p>
            <p className="font-headline text-2xl font-bold text-on-background">{mkList.length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">Total CLO</p>
            <p className="font-headline text-2xl font-bold text-primary">{totalCLO}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <p className="font-label text-sm text-on-surface-variant">MK Belum Ada CLO</p>
            <p className="font-headline text-2xl font-bold text-on-surface-variant">
              {mkList.filter((m) => cloCountByMK(m.nama) === 0).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient ghost-border">
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari mata kuliah berdasarkan kode atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm placeholder:text-outline"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Kode", "Nama Mata Kuliah", "SKS", "Semester", "Jumlah CLO", "Aksi"].map((h) => (
                    <th key={h} className={`font-label text-xs text-on-surface-variant uppercase tracking-wider px-6 py-4 ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMK.map((mk) => {
                  const cloCount = cloCountByMK(mk.nama);
                  return (
                    <tr key={mk.kode} className="hover:bg-surface-container-low transition-colors border-t border-surface-variant">
                      <td className="px-6 py-4">
                        <span className="font-label text-xs font-bold text-primary px-2 py-1 bg-primary-fixed rounded">{mk.kode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0">
                            <Icon name="menu_book" className="text-primary" size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-sm font-medium text-on-background">{mk.nama}</p>
                            <p className="font-label text-xs text-on-surface-variant line-clamp-1">{mk.deskripsi || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">{mk.sks} SKS</td>
                      <td className="px-6 py-4 font-label text-sm text-on-surface-variant whitespace-nowrap">Semester {mk.semester}</td>
                      <td className="px-6 py-4">
                        {cloCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-label text-xs font-semibold text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {cloCount} CLO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-label text-xs text-on-surface-variant">
                            <span className="w-2 h-2 rounded-full bg-outline" />
                            Belum ada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/clo/${mk.kode.toLowerCase()}`}
                            className="px-3 py-1.5 font-label text-xs font-bold text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Kelola CLO"
                          >
                            Kelola CLO
                            <Icon name="arrow_forward" size={14} />
                          </Link>
                          <button onClick={() => openEdit(mk)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors" title="Edit Mata Kuliah">
                            <Icon name="edit" size={18} />
                          </button>
                          <button onClick={() => setDeleteTarget(mk)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors" title="Hapus Mata Kuliah">
                            <Icon name="delete" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMK.length === 0 && (
                  <tr className="border-t border-surface-variant">
                    <td colSpan={6} className="px-6 py-10 text-center font-body text-sm text-on-surface-variant">
                      {mkList.length === 0 ? "Belum ada mata kuliah. Klik \"Tambah Mata Kuliah\" untuk memulai." : "Tidak ada mata kuliah yang cocok dengan pencarian."}
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
