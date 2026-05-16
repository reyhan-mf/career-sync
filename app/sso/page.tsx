"use client";

import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DemoRole = "mahasiswa" | "admin" | "superadmin";

const roleConfig: Record<DemoRole, { label: string; redirect: string; idLabel: string; idPlaceholder: string; icon: string }> = {
  mahasiswa: {
    label: "Mahasiswa",
    redirect: "/student/dashboard",
    idLabel: "NIM",
    idPlaceholder: "Masukkan NIM Anda",
    icon: "school",
  },
  admin: {
    label: "Admin Prodi",
    redirect: "/admin/dashboard",
    idLabel: "NIP / Email Institusi",
    idPlaceholder: "nama@univnusantara.ac.id",
    icon: "admin_panel_settings",
  },
  superadmin: {
    label: "Superadmin (IT Pusat)",
    redirect: "/superadmin/dashboard",
    idLabel: "Email Institusi",
    idPlaceholder: "admin@univnusantara.ac.id",
    icon: "shield_person",
  },
};

export default function SSOPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [demoRole, setDemoRole] = useState<DemoRole>("mahasiswa");

  const config = roleConfig[demoRole];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      router.push(config.redirect);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header SSO Kampus */}
        <div className="bg-primary px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 space-y-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Icon name="account_balance" className="text-primary text-3xl" filled />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Portal Akademik</h1>
            <p className="text-primary-100 text-sm">Single Sign-On (SSO) Terintegrasi</p>
          </div>
        </div>

        {/* Form Login */}
        <div className="p-8">
          {/* Demo role selector */}
          <div className="mb-5 px-4 py-3 bg-tertiary-fixed rounded-xl flex items-start gap-3">
            <Icon name="info" size={18} className="text-on-tertiary-container shrink-0 mt-0.5" />
            <p className="font-label text-xs text-on-tertiary-container leading-relaxed">
              Mode demo SSO. Pilih peran di bawah untuk masuk ke dashboard yang sesuai.
            </p>
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Login Sebagai</label>
            <Select value={demoRole} onValueChange={(v) => setDemoRole(v as DemoRole)}>
              <SelectTrigger className="h-12 w-full bg-gray-50 border-gray-200">
                <Icon name={config.icon} size={18} className="text-on-surface-variant shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                <SelectItem value="admin">Admin Prodi</SelectItem>
                <SelectItem value="superadmin">Superadmin (IT Pusat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">{config.idLabel}</label>
              <input
                required
                type="text"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder={config.idPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input
                required
                type="password"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Masukkan kata sandi SIAM/Portal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg py-3.5 mt-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Mengotentikasi sebagai {config.label}...
                </>
              ) : (
                <>Masuk via SSO sebagai {config.label}</>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <Icon name="arrow_back" size={16} />
              Kembali ke CareerSync
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
