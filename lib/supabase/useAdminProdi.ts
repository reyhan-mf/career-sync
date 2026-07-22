"use client";

import { useEffect, useState } from "react";
import { supabase } from "./client";
import type { AssessmentMode } from "./superadmin-queries";

export interface AdminProdiInfo {
  prodi_id: string;
  prodi_name: string;
  admin_name: string;
  fakultas: string | null;
  email: string | null;
  /** Where this prodi records grades — drives the grade-entry UI and scoring. */
  assessment_mode: AssessmentMode;
}

interface State {
  data: AdminProdiInfo | null;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves the current admin's prodi context (the prodi they manage). Used by
 * admin pages to scope queries and prefill `prodi_id` on insert. Returns null
 * if the user has no admin row.
 */
export function useAdminProdi(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ data: null, loading: false, error: "Tidak ada sesi." });
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select(`name, email, prodi:prodi_id ( id, name, fakultas, assessment_mode )`)
        .eq("user_id", session.user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setState({ data: null, loading: false, error: error.message });
        return;
      }
      if (!data || !data.prodi) {
        setState({
          data: null,
          loading: false,
          error: "Akun admin ini belum ditautkan ke prodi.",
        });
        return;
      }
      const prodi = data.prodi as unknown as {
        id: string;
        name: string;
        fakultas: string | null;
        assessment_mode: AssessmentMode | null;
      };
      setState({
        data: {
          prodi_id: prodi.id,
          prodi_name: prodi.name,
          admin_name: data.name,
          fakultas: prodi.fakultas,
          email: data.email,
          assessment_mode: prodi.assessment_mode ?? "clo",
        },
        loading: false,
        error: null,
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
