"use client";

import ChangePasswordModal from "@/components/ui/ChangePasswordModal";
import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  companyProfile as initialCompanyProfile,
  hrProfile as initialHrProfile,
} from "@/lib/hr-mock";
import React, { useState } from "react";

const inputCls =
  "w-full bg-surface-container-low rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";
const labelCls =
  "font-label text-xs font-medium text-on-surface-variant mb-1 block";

interface SavedFlag {
  section: string;
  ts: number;
}

export default function HRProfilePage() {
  const [hr, setHr] = useState({
    name: initialHrProfile.name,
    email: initialHrProfile.email,
    role: initialHrProfile.role,
  });
  const [company, setCompany] = useState({
    name: initialCompanyProfile.name,
    tagline: initialCompanyProfile.tagline,
    industry: initialCompanyProfile.industry,
    location: initialCompanyProfile.location,
    size: initialCompanyProfile.size,
    founded: initialCompanyProfile.founded,
    website: initialCompanyProfile.website,
    description: initialCompanyProfile.description,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [saved, setSaved] = useState<SavedFlag | null>(null);

  const initials = hr.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSaveHR = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved({ section: "hr", ts: Date.now() });
    setTimeout(() => setSaved(null), 2500);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved({ section: "company", ts: Date.now() });
    setTimeout(() => setSaved(null), 2500);
  };

  return (
    <>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ─── Header ─── */}
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Profil & Pengaturan
          </h1>
          <p className="font-body text-on-surface-variant">
            Kelola identitas Anda sebagai HR dan profil perusahaan yang
            ditampilkan ke pelamar.
          </p>
        </div>

        {/* ─── HR Identity Section ─── */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center">
                <Icon name="badge" className="text-primary" size={18} />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-on-background">
                  Identitas Saya
                </h2>
                <p className="font-label text-xs text-on-surface-variant">
                  Hanya terlihat oleh tim Anda
                </p>
              </div>
            </div>
            {saved?.section === "hr" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-label text-xs font-semibold">
                <Icon name="check_circle" size={14} />
                Tersimpan
              </span>
            )}
          </div>

          <form onSubmit={handleSaveHR} className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-headline text-xl font-bold text-on-primary">
                  {initials}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-bold text-on-background">
                  {hr.name}
                </p>
                <p className="font-label text-xs text-on-surface-variant">
                  {hr.role}
                </p>
                <button
                  type="button"
                  className="mt-1.5 inline-flex items-center gap-1 font-label text-xs text-primary hover:underline"
                >
                  <Icon name="upload" size={14} />
                  Ganti foto profil
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Lengkap</label>
                <input
                  type="text"
                  value={hr.name}
                  onChange={(e) => setHr({ ...hr, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Jabatan / Role</label>
                <input
                  type="text"
                  value={hr.role}
                  onChange={(e) => setHr({ ...hr, role: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Email Kerja</label>
                <input
                  type="email"
                  value={hr.email}
                  onChange={(e) => setHr({ ...hr, email: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-gradient font-label text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2"
              >
                <Icon name="save" size={16} />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </section>

        {/* ─── Company Profile Section ─── */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 ${initialCompanyProfile.logoBgClass} rounded-lg flex items-center justify-center`}
              >
                <Icon
                  name={initialCompanyProfile.logoIcon}
                  className={initialCompanyProfile.logoTextClass}
                  size={18}
                  filled
                />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-on-background">
                  Profil Perusahaan
                </h2>
                <p className="font-label text-xs text-on-surface-variant">
                  Ditampilkan publik ke pelamar dan talent pool
                </p>
              </div>
            </div>
            {saved?.section === "company" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-label text-xs font-semibold">
                <Icon name="check_circle" size={14} />
                Tersimpan
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Perusahaan</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) =>
                    setCompany({ ...company, name: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tagline</label>
                <input
                  type="text"
                  value={company.tagline}
                  onChange={(e) =>
                    setCompany({ ...company, tagline: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Industri</label>
                <Select
                  value={company.industry}
                  onValueChange={(v) => setCompany({ ...company, industry: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "E-commerce & Marketplace",
                      "Fintech",
                      "Banking",
                      "Telekomunikasi",
                      "Media & Hiburan",
                      "Pendidikan",
                      "Manufaktur",
                      "Logistik & Transportasi",
                      "Konsultan IT",
                    ].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls}>Lokasi Kantor Pusat</label>
                <input
                  type="text"
                  value={company.location}
                  onChange={(e) =>
                    setCompany({ ...company, location: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Ukuran Perusahaan</label>
                <Select
                  value={company.size}
                  onValueChange={(v) => setCompany({ ...company, size: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "1-10 karyawan",
                      "11-50 karyawan",
                      "51-200 karyawan",
                      "201-500 karyawan",
                      "501-1.000 karyawan",
                      "1.000-5.000 karyawan",
                      "5.000+ karyawan",
                    ].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls}>Tahun Berdiri</label>
                <input
                  type="text"
                  value={company.founded}
                  onChange={(e) =>
                    setCompany({ ...company, founded: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Website</label>
                <input
                  type="text"
                  value={company.website}
                  onChange={(e) =>
                    setCompany({ ...company, website: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Deskripsi Perusahaan</label>
                <textarea
                  rows={4}
                  value={company.description}
                  onChange={(e) =>
                    setCompany({ ...company, description: e.target.value })
                  }
                  className={`${inputCls} resize-none`}
                  placeholder="Ceritakan tentang perusahaan Anda..."
                />
                <p className="font-label text-xs text-on-surface-variant mt-1">
                  Deskripsi akan ditampilkan di profil publik perusahaan dan
                  halaman lowongan.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="btn-gradient font-label text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2"
              >
                <Icon name="save" size={16} />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </section>

        {/* ─── Security Section ─── */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center">
              <Icon name="lock" className="text-tertiary" size={18} />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-on-background">
                Keamanan
              </h2>
              <p className="font-label text-xs text-on-surface-variant">
                Lindungi akun Anda
              </p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low">
              <div>
                <p className="font-body text-sm font-semibold text-on-background">
                  Password
                </p>
                <p className="font-label text-xs text-on-surface-variant">
                  Ganti secara berkala untuk menjaga keamanan akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline/30 font-label text-sm font-semibold text-on-background hover:bg-surface-container transition-colors shrink-0"
              >
                <Icon name="lock_reset" size={16} />
                Ganti Password
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low opacity-60">
              <div>
                <p className="font-body text-sm font-semibold text-on-background">
                  Two-Factor Authentication
                </p>
                <p className="font-label text-xs text-on-surface-variant">
                  Tambahkan lapisan keamanan tambahan saat login.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container font-label text-xs font-semibold text-on-surface-variant shrink-0">
                Segera Hadir
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
