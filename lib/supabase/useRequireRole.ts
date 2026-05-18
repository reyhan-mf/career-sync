"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./client";
import { roleDashboard, type UserRole } from "./auth";

interface RequireRoleState {
  status: "checking" | "ok" | "redirecting";
  error: string | null;
}

/**
 * Client-side gate for role-protected layouts. Resolves the current session,
 * looks up the user's role, and:
 *   - redirects to /login (with a reason) when there is no session
 *   - redirects to the user's own dashboard when the role does not match
 *   - flips status to "ok" when the role matches
 */
export function useRequireRole(expected: UserRole): RequireRoleState {
  const router = useRouter();
  const [state, setState] = useState<RequireRoleState>({
    status: "checking",
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = (reason: string) => {
      if (cancelled) return;
      setState({ status: "redirecting", error: reason });
      router.replace(`/login?error=${encodeURIComponent(reason)}`);
    };

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        redirectToLogin("Anda harus login terlebih dahulu.");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        redirectToLogin(`Gagal memeriksa role: ${error.message}`);
        return;
      }
      const role = data?.role as UserRole | undefined;
      if (!role) {
        await supabase.auth.signOut().catch(() => {});
        redirectToLogin("Akun ini belum memiliki role. Hubungi superadmin.");
        return;
      }
      if (role !== expected) {
        setState({ status: "redirecting", error: null });
        router.replace(roleDashboard[role]);
        return;
      }
      setState({ status: "ok", error: null });
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [expected, router]);

  return state;
}
