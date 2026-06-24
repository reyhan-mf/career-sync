"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  getSuperadminDataSnapshot,
  subscribeSuperadminData,
  superadminDataMutators,
  type SuperadminDataState,
} from "@/lib/supabase/superadminDataStore";
import type {
  AdminUserWithProdi,
  Prodi,
} from "@/lib/supabase/superadmin-queries";

interface SuperadminDataContextValue extends SuperadminDataState {
  setAdmins: (updater: (prev: AdminUserWithProdi[]) => AdminUserWithProdi[]) => void;
  setProdis: (updater: (prev: Prodi[]) => Prodi[]) => void;
}

// Initialization is driven by the auth listener in superadminDataStore
// (INITIAL_SESSION on load, SIGNED_IN on login). No eager call here — that
// previously raced against an unresolved session.

export function SuperadminDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(
    subscribeSuperadminData,
    getSuperadminDataSnapshot,
    getSuperadminDataSnapshot,
  );
  return <>{children}</>;
}

export function useSuperadminData(): SuperadminDataContextValue {
  const snap = useSyncExternalStore(
    subscribeSuperadminData,
    getSuperadminDataSnapshot,
    getSuperadminDataSnapshot,
  );
  return { ...snap, ...superadminDataMutators };
}
