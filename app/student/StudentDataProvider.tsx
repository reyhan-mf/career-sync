"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  getStudentDataSnapshot,
  subscribeStudentData,
  type StudentDataState,
} from "@/lib/supabase/studentDataStore";

// Initialization is driven by the auth listener in studentDataStore
// (INITIAL_SESSION on load, SIGNED_IN on login). No eager call here — that
// previously raced against an unresolved session and left data empty/stale.

export function StudentDataProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeStudentData, getStudentDataSnapshot, getStudentDataSnapshot);
  return <>{children}</>;
}

export function useStudentData(): StudentDataState {
  return useSyncExternalStore(subscribeStudentData, getStudentDataSnapshot, getStudentDataSnapshot);
}
