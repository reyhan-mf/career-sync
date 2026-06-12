"use client";

import AuthGate from "@/components/auth/AuthGate";
import type { NavItem } from "@/components/layout/Sidebar";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import TopBar from "@/components/layout/TopBar";
import React from "react";
import { StudentDataProvider } from "./StudentDataProvider";

const studentNav: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/student/dashboard" },
  { label: "Job Matching", icon: "work", href: "/student/job-matching" },
  { label: "Lamaran Saya", icon: "description", href: "/student/applications" },
  { label: "Undangan", icon: "forward_to_inbox", href: "/student/invitations" },
  { label: "Profil Kompetensi", icon: "person", href: "/student/profile" },
];

const bottomNav: NavItem[] = [
  { label: "Notifikasi", icon: "notifications", href: "/notifications" },
  { label: "Bantuan", icon: "help_center", href: "#" },
];

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={studentNav} bottomItems={bottomNav} role="student" />
      {/* Always use collapsed sidebar width (72px ≈ ml-18) on desktop.
          Expanded sidebar overlays content instead of pushing it. */}
      <div className="flex-1 flex flex-col transition-all duration-300 md:ml-18">
        <TopBar />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate role="student">
      <StudentDataProvider>
        <SidebarProvider>
          <StudentLayoutInner>{children}</StudentLayoutInner>
        </SidebarProvider>
      </StudentDataProvider>
    </AuthGate>
  );
}
