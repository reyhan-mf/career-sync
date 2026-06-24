"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  getHrDataSnapshot,
  subscribeHrData,
  type HRDataState,
} from "@/lib/supabase/hrDataStore";

// Initialization is driven entirely by the auth listener in hrDataStore
// (INITIAL_SESSION on load, SIGNED_IN on login). No eager call here — that
// previously raced against an unresolved session.

export function HRDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeHrData, getHrDataSnapshot, getHrDataSnapshot);
  return <>{children}</>;
}

export function useHRData(): HRDataState {
  return useSyncExternalStore(subscribeHrData, getHrDataSnapshot, getHrDataSnapshot);
}
