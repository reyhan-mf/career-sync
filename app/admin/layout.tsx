"use client";

import AuthGate from "@/components/auth/AuthGate";
import type { NavItem } from "@/components/layout/Sidebar";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import TopBar from "@/components/layout/TopBar";
import React from "react";
import { AdminDataProvider } from "./AdminDataProvider";

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { label: "Manajemen Pengguna", icon: "group", href: "/admin/users" },
  { label: "Manajemen CLO", icon: "school", href: "/admin/clo" },
  { label: "Manajemen Nilai", icon: "grade", href: "/admin/grades" },
];

const bottomNav: NavItem[] = [];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNav} bottomItems={bottomNav} role="admin" />
      <div className="flex-1 flex flex-col transition-all duration-300 md:ml-18">
        <TopBar />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate role="admin">
      <AdminDataProvider>
        <SidebarProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </SidebarProvider>
      </AdminDataProvider>
    </AuthGate>
  );
}
