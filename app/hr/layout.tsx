"use client";

import AuthGate from "@/components/auth/AuthGate";
import type { NavItem } from "@/components/layout/Sidebar";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import TopBar from "@/components/layout/TopBar";
import React from "react";
import { HRDataProvider } from "./HRDataProvider";

const hrNav: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/hr/dashboard" },
  { label: "Kelola Lowongan", icon: "work", href: "/hr/jobs" },
  { label: "Daftar Pelamar", icon: "group", href: "/hr/applicants" },
  { label: "Talent Pool", icon: "diversity_3", href: "/hr/talent-pool" },
];

const bottomNav: NavItem[] = [
  { label: "Notifikasi", icon: "notifications", href: "/notifications" },
  { label: "Profil & Pengaturan", icon: "manage_accounts", href: "/hr/profile" },
  { label: "Bantuan", icon: "help_center", href: "#" },
];

function HRLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={hrNav} bottomItems={bottomNav} role="hr" />
      <div className="flex-1 flex flex-col transition-all duration-300 md:ml-18">
        <TopBar />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="hr">
      <HRDataProvider>
        <SidebarProvider>
          <HRLayoutInner>{children}</HRLayoutInner>
        </SidebarProvider>
      </HRDataProvider>
    </AuthGate>
  );
}
