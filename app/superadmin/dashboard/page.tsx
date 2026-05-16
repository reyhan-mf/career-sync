"use client";

import React from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import StatCard from "@/components/ui/StatCard";
import {
  initialAdminAccounts,
  prodiIntegrationStatus,
  superadminProfile,
} from "@/lib/admin-mock";

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Aktif" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Dalam Proses" },
  planned: { bg: "bg-surface-container", text: "text-on-surface-variant", dot: "bg-outline", label: "Belum Terintegrasi" },
};

export default function SuperadminDashboard() {
  const totalAdmin = initialAdminAccounts.length;
  const activeAdmin = initialAdminAccounts.filter((a) => a.status === "active").length;
  const integratedProdi = prodiIntegrationStatus.filter((p) => p.status === "active").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Identity Banner */}
      <div className="bg-linear-to-r from-tertiary to-primary rounded-2xl p-6 shadow-ambient relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -right-4 top-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
            <span className="font-headline text-2xl font-bold text-white">{superadminProfile.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-headline text-2xl font-bold text-white">{superadminProfile.name}</h1>
              <span className="px-2.5 py-0.5 bg-white/25 backdrop-blur-sm rounded-full font-label text-xs font-semibold text-white border border-white/30 inline-flex items-center gap-1">
                <Icon name="shield_person" size={12} /> {superadminProfile.role}
              </span>
            </div>
            <p className="font-body text-sm text-white/90 mb-1">{superadminProfile.email}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/85">
              <span className="font-label text-sm flex items-center gap-1.5">
                <Icon name="apartment" size={14} className="text-white/85" /> {superadminProfile.unit}
              </span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />
              <span className="font-label text-xs">{superadminProfile.university}</span>
            </div>
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
        <StatCard icon="check_circle" label="Admin Aktif" value={activeAdmin} iconBgClass="bg-green-50" iconTextClass="text-green-700" />
        <StatCard icon="school" label="Prodi Terintegrasi" value={`${integratedProdi}/${prodiIntegrationStatus.length}`} iconBgClass="bg-blue-50" iconTextClass="text-blue-700" />
        <StatCard icon="cloud_sync" label="Status SSO" value="Simulasi" iconBgClass="bg-tertiary-fixed" iconTextClass="text-tertiary" />
      </div>

      {/* Prodi Integration Insight */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-background">Status Integrasi Prodi</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Daftar prodi yang terhubung ke CareerSync via admin perantara (simulasi SSO).
            </p>
          </div>
          <Link
            href="/superadmin/admins"
            className="font-label text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Kelola Admin <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prodiIntegrationStatus.map((p) => {
            const style = statusStyles[p.status];
            const adminCount = initialAdminAccounts.filter((a) => a.prodi === p.name).length;
            return (
              <div
                key={p.name}
                className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low"
              >
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
                <div className="flex items-center justify-between">
                  <p className="font-label text-xs text-on-surface-variant">{p.note}</p>
                  <p className="font-label text-xs font-semibold text-on-background">
                    {adminCount} admin
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-background">Admin Terbaru</h2>
          <Link
            href="/superadmin/admins"
            className="font-label text-sm font-semibold text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="space-y-3">
          {initialAdminAccounts.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center shrink-0">
                <Icon name="person" className="text-primary" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-on-background truncate">{a.name}</p>
                <p className="font-label text-xs text-on-surface-variant truncate">
                  {a.prodi} • Login terakhir: {a.lastLogin}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 font-label text-xs shrink-0 ${a.status === "active" ? "text-green-700" : "text-on-surface-variant"}`}>
                <span className={`w-2 h-2 rounded-full ${a.status === "active" ? "bg-green-500" : "bg-outline"}`} />
                {a.status === "active" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
