"use client";

import type { ReactNode } from "react";
import { useRequireRole } from "@/lib/supabase/useRequireRole";
import type { UserRole } from "@/lib/supabase/auth";

interface AuthGateProps {
  role: UserRole;
  children: ReactNode;
}

export default function AuthGate({ role, children }: AuthGateProps) {
  const { status } = useRequireRole(role);

  if (status !== "ok") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="font-body text-sm text-on-surface-variant">
          {status === "checking" ? "Memeriksa sesi…" : "Mengalihkan…"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
