"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  adminDataMutators,
  getAdminDataSnapshot,
  subscribeAdminData,
  type AdminDataState,
} from "@/lib/supabase/adminDataStore";
import type { CLO, Matkul, Student, StudentCLO } from "@/lib/supabase/admin-queries";

interface AdminDataContextValue extends AdminDataState {
  setStudents: (updater: (prev: Student[]) => Student[]) => void;
  setMatkul: (updater: (prev: Matkul[]) => Matkul[]) => void;
  setClos: (updater: (prev: CLO[]) => CLO[]) => void;
  setStudentClos: (updater: (prev: StudentCLO[]) => StudentCLO[]) => void;
}

// Initialization is driven by the auth listener in adminDataStore
// (INITIAL_SESSION on load, SIGNED_IN on login). No eager call here — that
// previously raced against an unresolved session.

export function AdminDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeAdminData, getAdminDataSnapshot, getAdminDataSnapshot);
  return <>{children}</>;
}

export function useAdminData(): AdminDataContextValue {
  const snap = useSyncExternalStore(subscribeAdminData, getAdminDataSnapshot, getAdminDataSnapshot);
  return { ...snap, ...adminDataMutators };
}
