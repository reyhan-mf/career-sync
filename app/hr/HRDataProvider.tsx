"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  ensureHrDataInitialized,
  getHrDataSnapshot,
  subscribeHrData,
  type HRDataState,
} from "@/lib/supabase/hrDataStore";

if (typeof window !== "undefined") {
  ensureHrDataInitialized().catch(() => {});
}

export function HRDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeHrData, getHrDataSnapshot, getHrDataSnapshot);
  return <>{children}</>;
}

export function useHRData(): HRDataState {
  return useSyncExternalStore(subscribeHrData, getHrDataSnapshot, getHrDataSnapshot);
}
