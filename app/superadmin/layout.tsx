"use client";

import AuthGate from "@/components/auth/AuthGate";
import type { NavItem } from "@/components/layout/Sidebar";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import TopBar from "@/components/layout/TopBar";
import React from "react";
import { SuperadminDataProvider } from "./SuperadminDataProvider";

const superadminNav: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/superadmin/dashboard" },
  { label: "Kelola Admin Prodi", icon: "admin_panel_settings", href: "/superadmin/admins" },
];

const bottomNav: NavItem[] = [];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="superadmin">
      <SuperadminDataProvider>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar items={superadminNav} bottomItems={bottomNav} role="superadmin" />
            <div className="flex-1 flex flex-col transition-all duration-300 md:ml-18">
              <TopBar />
              <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </SuperadminDataProvider>
    </AuthGate>
  );
}
