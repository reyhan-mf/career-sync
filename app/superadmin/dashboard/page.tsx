"use client";

import React from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCardSkeleton, StatGridSkeleton } from "@/components/ui/Skeletons";
import { getDisplayName, getInitials } from "@/lib/supabase/auth";
import { useSuperadminData } from "../SuperadminDataProvider";

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Aktif" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Dalam Proses" },
  planned: { bg: "bg-surface-container", text: "text-on-surface-variant", dot: "bg-outline", label: "Belum Terintegrasi" },
};

export default function SuperadminDashboard() {
  const { admins, prodis, currentUser: user, loading } = useSuperadminData();

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const totalAdmin = admins.length;
  const integratedProdi = prodis.filter((p) => p.integration_status === "active").length;
  const prodiWithoutAdmin = prodis.filter((p) => !admins.some((a) => a.prodi_id === p.id));
  const adminsWithoutAccount = admins.filter((a) => !a.user_id);

  const adminCountByProdi = prodis
    .map((p) => ({ id: p.id, name: p.name, count: admins.filter((a) => a.prodi_id === p.id).length }))
    .sort((a, b) => b.count - a.count);
  const maxAdminCount = Math.max(1, ...adminCountByProdi.map((p) => p.count));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <StatGridSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Identity Banner */}
      <div className="bg-linear-to-r from-tertiary to-primary rounded-2xl p-6 shadow-ambient relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -right-4 top-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
            <span className="font-headline text-2xl font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-headline text-2xl font-bold text-white">{displayName}</h1>
              <span className="px-2.5 py-0.5 bg-white/25 backdrop-blur-sm rounded-full font-label text-xs font-semibold text-white border border-white/30 inline-flex items-center gap-1">
                <Icon name="shield_person" size={12} /> Superadmin
              </span>
            </div>
            <p className="font-body text-sm text-white/90">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-headline text-xl font-bold text-on-background">Overview Sistem</h2>
        <p className="font-body text-sm text-on-surface-variant">
          Ringkasan integrasi prodi dan akun admin lintas sistem CareerSync.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="admin_panel_settings" label="Total Admin Prodi" value={totalAdmin} />
        <StatCard
          icon="link_off"
          label="Admin Tanpa Akun"
          value={adminsWithoutAccount.length}
          iconBgClass={adminsWithoutAccount.length > 0 ? "bg-amber-50" : "bg-green-50"}
          iconTextClass={adminsWithoutAccount.length > 0 ? "text-amber-700" : "text-green-700"}
        />
        <StatCard
          icon="domain_disabled"
          label="Prodi Tanpa Admin"
          value={prodiWithoutAdmin.length}
          iconBgClass={prodiWithoutAdmin.length > 0 ? "bg-amber-50" : "bg-green-50"}
          iconTextClass={prodiWithoutAdmin.length > 0 ? "text-amber-700" : "text-green-700"}
        />
        <StatCard icon="school" label="Prodi Terintegrasi" value={`${integratedProdi}/${prodis.length}`} iconBgClass="bg-blue-50" iconTextClass="text-blue-700" />
      </div>

      {/* Perlu Perhatian */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="priority_high" size={20} className="text-amber-700" />
          <h2 className="font-headline text-xl font-bold text-on-background">Perlu Perhatian</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Prodi tanpa admin */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Icon name="domain_disabled" size={18} className="text-amber-700" />
                </div>
                <div>
                  <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Belum Dilayani</p>
                  <p className="font-headline text-lg font-bold text-on-background leading-tight">Prodi Tanpa Admin</p>
                </div>
              </div>
              <span className="font-headline text-2xl font-bold text-amber-700">{prodiWithoutAdmin.length}</span>
            </div>
            {prodiWithoutAdmin.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant flex-1 flex items-center justify-center text-center py-3">
                Semua prodi sudah punya admin.
              </p>
            ) : (
              <ul className="space-y-1.5 flex-1">
                {prodiWithoutAdmin.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-body text-on-background truncate">{p.name}</span>
                  </li>
                ))}
                {prodiWithoutAdmin.length > 4 && (
                  <li className="font-label text-xs text-on-surface-variant pt-1">
                    +{prodiWithoutAdmin.length - 4} prodi lainnya
                  </li>
                )}
              </ul>
            )}
            {prodiWithoutAdmin.length > 0 && (
              <Link href="/superadmin/admins" className="mt-4 font-label text-sm font-semibold text-primary hover:opacity-80 transition-opacity inline-flex items-center gap-1">
                Tambah admin <Icon name="arrow_forward" size={16} />
              </Link>
            )}
          </div>

          {/* Admin tanpa akun */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon name="manage_accounts" size={18} className="text-blue-700" />
                </div>
                <div>
                  <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Belum Provisioned</p>
                  <p className="font-headline text-lg font-bold text-on-background leading-tight">Admin Tanpa Akun</p>
                </div>
              </div>
              <span className="font-headline text-2xl font-bold text-blue-700">{adminsWithoutAccount.length}</span>
            </div>
            {adminsWithoutAccount.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant flex-1 flex items-center justify-center text-center py-3">
                Semua admin sudah punya akun login.
              </p>
            ) : (
              <ul className="space-y-1.5 flex-1">
                {adminsWithoutAccount.slice(0, 4).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-body text-on-background truncate">{a.name}</p>
                    <p className="font-label text-xs text-on-surface-variant truncate">{a.prodi?.name ?? "—"}</p>
                  </li>
                ))}
                {adminsWithoutAccount.length > 4 && (
                  <li className="font-label text-xs text-on-surface-variant pt-1">+{adminsWithoutAccount.length - 4} admin lainnya</li>
                )}
              </ul>
            )}
            {adminsWithoutAccount.length > 0 && (
              <p className="mt-4 font-label text-xs text-on-surface-variant leading-snug">
                Buat akun login untuk admin agar mereka dapat mengakses sistem.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Distribusi Admin per Prodi */}
      {/* <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-background">Distribusi Admin per Prodi</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Bandingkan beban admin antar prodi.
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          {adminCountByProdi.map((p) => {
            const widthPct = (p.count / maxAdminCount) * 100;
            const isEmpty = p.count === 0;
            const isSingle = p.count === 1;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <p className="font-label text-sm text-on-background w-48 truncate shrink-0">{p.name}</p>
                <div className="flex-1 h-7 bg-surface-container-low rounded-lg overflow-hidden relative">
                  {!isEmpty && (
                    <div className={`h-full ${isSingle ? "bg-amber-400/70" : "bg-primary/70"} transition-all`}
                      style={{ width: `${widthPct}%` }} />
                  )}
                </div>
                <div className="w-24 text-right shrink-0">
                  {isEmpty ? (
                    <span className="font-label text-xs font-semibold text-amber-700">Belum ada</span>
                  ) : (
                    <span className="font-label text-sm font-semibold text-on-background">
                      {p.count} <span className="text-on-surface-variant font-normal">admin</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {prodis.length === 0 && (
            <p className="font-body text-sm text-on-surface-variant text-center py-4">Belum ada prodi.</p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap gap-4 text-xs font-label text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/70" /> 2+ admin (aman)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/70" /> 1 admin (single point of failure)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-surface-container border border-outline-variant/30" /> Belum ada admin</span>
        </div>
      </div> */}

      {/* Prodi Integration Insight */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-background">Status Integrasi Prodi</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Daftar prodi yang terhubung ke CareerSync.
            </p>
          </div>
          <Link href="/superadmin/admins" className="font-label text-sm font-semibold text-primary hover:opacity-80 transition-opacity inline-flex items-center gap-1">
            Kelola Admin <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        {prodis.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant text-center py-4">Belum ada prodi terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prodis.map((p) => {
              const style = statusStyles[p.integration_status ?? "planned"] ?? statusStyles.planned;
              const adminCount = admins.filter((a) => a.prodi_id === p.id).length;
              return (
                <div key={p.id} className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="school" size={18} className="text-on-surface-variant" />
                      <p className="font-label text-sm font-bold text-on-background truncate">{p.name}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-xs font-semibold shrink-0 ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="font-label text-xs font-semibold text-on-background">{adminCount} admin</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Terbaru */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-background">Admin Terbaru</h2>
          <Link href="/superadmin/admins" className="font-label text-sm font-semibold text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>
        {admins.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant text-center py-4">Belum ada admin terdaftar.</p>
        ) : (
          <div className="space-y-3">
            {admins.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-primary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-on-background truncate">{a.name}</p>
                  <p className="font-label text-xs text-on-surface-variant truncate">
                    {a.prodi?.name ?? "—"}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 font-label text-xs shrink-0 ${a.user_id ? "text-green-700" : "text-amber-700"}`}>
                  <span className={`w-2 h-2 rounded-full ${a.user_id ? "bg-green-500" : "bg-amber-400"}`} />
                  {a.user_id ? "Punya Akun" : "Tanpa Akun"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
