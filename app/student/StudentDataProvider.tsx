"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  ensureStudentDataInitialized,
  getStudentDataSnapshot,
  subscribeStudentData,
  type StudentDataState,
} from "@/lib/supabase/studentDataStore";

if (typeof window !== "undefined") {
  ensureStudentDataInitialized().catch(() => {});
}

export function StudentDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeStudentData, getStudentDataSnapshot, getStudentDataSnapshot);
  return <>{children}</>;
}

export function useStudentData(): StudentDataState {
  return useSyncExternalStore(subscribeStudentData, getStudentDataSnapshot, getStudentDataSnapshot);
}
