"use client";

import Icon from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signInAndResolveRole, type UserRole } from "@/lib/supabase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SSORole = Extract<UserRole, "student" | "admin" | "superadmin">;

const roleConfig: Record<SSORole, {
  label: string;
  idLabel: string;
  idPlaceholder: string;
  icon: string;
  // Dev/demo credentials prefilled when switching role, so testing doesn't
  // require retyping. Safe to remove before going to production.
  email: string;
  password: string;
}> = {
  student: {
    label: "Mahasiswa",
    idLabel: "Email Mahasiswa",
    idPlaceholder: "mahasiswa@univnusantara.ac.id",
    icon: "school",
    email: "reyhan.3du@upi.edu",
    password: "123123123",
  },
  admin: {
    label: "Admin Prodi",
    idLabel: "Email Institusi",
    idPlaceholder: "admin.prodi@univnusantara.ac.id",
    icon: "admin_panel_settings",
    email: "alfiansyah@telu.edu",
    password: "123123123",
  },
  superadmin: {
    label: "Superadmin (IT Pusat)",
    idLabel: "Email Institusi",
    idPlaceholder: "admin@univnusantara.ac.id",
    icon: "shield_person",
    email: "reyhan@superadmin.com",
    password: "superadmin123",
  },
};

export default function SSOPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<SSORole>("student");
  const [email, setEmail] = useState(roleConfig.student.email);
  const [password, setPassword] = useState(roleConfig.student.password);
  const [error, setError] = useState<string | null>(null);

  const config = roleConfig[role];

  // Switching role prefills that role's demo credentials.
  const handleRoleChange = (v: SSORole) => {
    setRole(v);
    setEmail(roleConfig[v].email);
    setPassword(roleConfig[v].password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { redirectTo } = await signInAndResolveRole(email, password, role);
      router.replace(redirectTo);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
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
          <div className="mb-5 px-4 py-3 bg-tertiary-fixed rounded-xl flex items-start gap-3">
            <Icon name="info" size={18} className="text-on-tertiary-container shrink-0 mt-0.5" />
            <p className="font-label text-xs text-on-tertiary-container leading-relaxed">
              Pilih peran sesuai akun Anda. Sistem akan memverifikasi role di
              database Supabase setelah login.
            </p>
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Login Sebagai</label>
            <Select value={role} onValueChange={(v) => handleRoleChange(v as SSORole)}>
              <SelectTrigger className="h-12 w-full bg-gray-50 border-gray-200">
                <Icon name={config.icon} size={18} className="text-on-surface-variant shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Mahasiswa</SelectItem>
                <SelectItem value="admin">Admin Prodi</SelectItem>
                <SelectItem value="superadmin">Superadmin (IT Pusat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">{config.idLabel}</label>
              <input
                required
                type="email"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder={config.idPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Login...
                </>
              ) : (
                <>Login</>
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
