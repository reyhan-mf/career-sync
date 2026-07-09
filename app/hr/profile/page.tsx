"use client";

import ChangePasswordModal from "@/components/ui/ChangePasswordModal";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/ui/Skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateCompany,
  updateHrProfile,
  type Company,
  type HRProfileWithCompany,
} from "@/lib/supabase/hr-queries";
import { hrDataMutators } from "@/lib/supabase/hrDataStore";
import { reportHrError } from "@/lib/supabase/hrErrors";
import React, { useState } from "react";
import { useHRData } from "../HRDataProvider";

const inputCls =
  "w-full bg-surface-container-low rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 font-body text-sm text-on-background placeholder:text-outline border border-outline-variant/30";
const labelCls =
  "font-label text-xs font-medium text-on-surface-variant mb-1 block";

const industryOptions = [
  "E-commerce & Marketplace",
  "Fintech",
  "Banking",
  "Telekomunikasi",
  "Media & Hiburan",
  "Pendidikan",
  "Manufaktur",
  "Logistik & Transportasi",
  "Pariwisata & Travel",
  "Konsultan IT",
];

const sizeOptions = [
  "1-10 karyawan",
  "11-50 karyawan",
  "51-200 karyawan",
  "201-500 karyawan",
  "501-1.000 karyawan",
  "1.000-5.000 karyawan",
  "5.000+ karyawan",
];

export default function HRProfilePage() {
  const { hr, company, loading, error } = useHRData();

  const [showChangePassword, setShowChangePassword] = useState(false);

  if (loading && !hr) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <CardSkeleton lines={4} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={2} />
      </div>
    );
  }

  return (
    <>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Profil & Pengaturan
          </h1>
          <p className="font-body text-on-surface-variant">
            Kelola identitas Anda sebagai HR dan profil perusahaan yang
            ditampilkan ke pelamar.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {error}
          </div>
        )}

        {hr && <HRIdentitySection key={hr.id} hr={hr} />}

        {company ? (
          <CompanySection key={company.id} company={company} />
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30">
              <h2 className="font-headline text-base font-bold text-on-background">
                Profil Perusahaan
              </h2>
            </div>
            <div className="p-6 text-center font-body text-sm text-on-surface-variant">
              Akun Anda belum ditautkan ke perusahaan. Hubungi superadmin.
            </div>
          </section>
        )}

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

          <div className="p-6">
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
          </div>
        </section>
      </div>
    </>
  );
}

function HRIdentitySection({ hr }: { hr: HRProfileWithCompany }) {
  const [name, setName] = useState(hr.name ?? "");
  const [position, setPosition] = useState(hr.position ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const initials = (name || hr.name || "HR")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateHrProfile(hr.id, {
        name: name.trim(),
        position: position.trim() || null,
      });
      hrDataMutators.setHr((prev) =>
        prev ? { ...prev, name: updated.name, position: updated.position } : prev,
      );
      const ts = Date.now();
      setSavedAt(ts);
      setTimeout(() => setSavedAt((cur) => (cur === ts ? null : cur)), 2500);
    } catch (err) {
      setActionError(reportHrError(err, "profile.updateHr"));
    } finally {
      setSaving(false);
    }
  };

  return (
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
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-label text-xs font-semibold">
            <Icon name="check_circle" size={14} />
            Tersimpan
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {actionError && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-headline text-xl font-bold text-on-primary">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-bold text-on-background truncate">
              {name || "—"}
            </p>
            <p className="font-label text-xs text-on-surface-variant truncate">
              {position || hr.email || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jabatan / Role</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={inputCls}
              placeholder="contoh: Senior Talent Acquisition"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Email Kerja</label>
            <input
              type="email"
              value={hr.email}
              disabled
              className={`${inputCls} opacity-70`}
            />
            <p className="font-label text-xs text-on-surface-variant mt-1">
              Email login tidak dapat diubah dari halaman ini.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-gradient font-label text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 disabled:opacity-60"
          >
            <Icon name="save" size={16} />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CompanySection({ company }: { company: Company }) {
  const [name, setName] = useState(company.name ?? "");
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [location, setLocation] = useState(company.location ?? "");
  const [size, setSize] = useState(company.size ?? "");
  const [founded, setFounded] = useState(company.founded ?? "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [description, setDescription] = useState(company.description ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateCompany(company.id, {
        name: name.trim(),
        industry: industry || null,
        location: location.trim() || null,
        size: size || null,
        founded: founded.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
      });
      hrDataMutators.setCompany(() => updated);
      const ts = Date.now();
      setSavedAt(ts);
      setTimeout(() => setSavedAt((cur) => (cur === ts ? null : cur)), 2500);
    } catch (err) {
      setActionError(reportHrError(err, "profile.updateCompany"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center">
            <Icon
              name={company.logo_icon ?? "storefront"}
              className="text-primary"
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
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-label text-xs font-semibold">
            <Icon name="check_circle" size={14} />
            Tersimpan
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {actionError && (
          <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nama Perusahaan</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Industri</label>
            <Select value={industry || undefined} onValueChange={setIndustry}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih industri" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((o) => (
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputCls}
              placeholder="contoh: Jakarta Selatan, Indonesia"
            />
          </div>
          <div>
            <label className={labelCls}>Ukuran Perusahaan</label>
            <Select value={size || undefined} onValueChange={setSize}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih ukuran" />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((o) => (
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
              value={founded}
              onChange={(e) => setFounded(e.target.value)}
              className={inputCls}
              placeholder="contoh: 2009"
            />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputCls}
              placeholder="contoh: tokopedia.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Deskripsi Perusahaan</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            disabled={saving}
            className="btn-gradient font-label text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 disabled:opacity-60"
          >
            <Icon name="save" size={16} />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </section>
  );
}
