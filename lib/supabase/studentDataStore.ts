import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  getActiveJobs,
  getCurrentStudentProfile,
  getMyApplications,
  getStudentTranscript,
  type CourseRecord,
  type JobListing,
  type StudentApplication,
  type StudentProfile,
} from "./student-queries";
import type { StudentCLO } from "./admin-queries";
import { reportStudentError } from "./studentErrors";

export interface StudentDataState {
  profile: StudentProfile | null;
  transcript: CourseRecord[];
  jobs: JobListing[];
  applications: StudentApplication[];
  loading: boolean;
  error: string | null;
}

const initialState: StudentDataState = {
  profile: null,
  transcript: [],
  jobs: [],
  applications: [],
  loading: false,
  error: null,
};

let state: StudentDataState = initialState;
let initPromise: Promise<void> | null = null;
let channels: RealtimeChannel[] = [];
const listeners = new Set<() => void>();

function setState(patch: Partial<StudentDataState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function applyGradeChange(payload: {
  eventType: string;
  new: unknown;
  old: unknown;
}) {
  // Build a fresh transcript with the grade map updated for this single
  // student_clos change. Avoids refetching everything.
  const isDelete = payload.eventType === "DELETE";
  const row = (isDelete ? payload.old : payload.new) as StudentCLO;
  if (!row?.clo_id) return;

  const transcript = state.transcript.map((course) => ({
    ...course,
    clos: course.clos.map((c) => {
      if (c.id !== row.clo_id) return c;
      return { ...c, grade: isDelete ? null : row.grade };
    }),
  }));
  setState({ transcript });
}

function subscribeRealtime(studentId: string) {
  if (channels.length > 0) return;

  // HMR guard.
  const ourTopics = [
    `student-self-${studentId}`,
    `student-grades-${studentId}`,
  ];
  supabase.getChannels().forEach((ch) => {
    if (ourTopics.includes(ch.topic.replace(/^realtime:/, ""))) {
      supabase.removeChannel(ch);
    }
  });

  // Watch the student's own row (status, etc.)
  const selfCh = supabase
    .channel(`student-self-${studentId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "students", filter: `id=eq.${studentId}` },
      (payload) => {
        const row = payload.new as StudentDataState["profile"] extends infer P
          ? P extends { student: infer S }
            ? S
            : never
          : never;
        if (!state.profile) return;
        setState({ profile: { ...state.profile, student: { ...state.profile.student, ...row } } });
      },
    )
    .subscribe();

  // Watch this student's grades.
  const gradesCh = supabase
    .channel(`student-grades-${studentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "student_clos", filter: `student_id=eq.${studentId}` },
      (payload) => applyGradeChange(payload as never),
    )
    .subscribe();

  channels = [selfCh, gradesCh];
}

export function ensureStudentDataInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const profile = await getCurrentStudentProfile();
      const [transcript, jobs, applications] = await Promise.all([
        getStudentTranscript(profile.student.id, profile.student.prodi_id),
        getActiveJobs().catch(() => [] as JobListing[]),
        getMyApplications(profile.student.id).catch(() => [] as StudentApplication[]),
      ]);
      setState({ profile, transcript, jobs, applications, loading: false, error: null });
      subscribeRealtime(profile.student.id);
    } catch (e) {
      setState({ loading: false, error: reportStudentError(e, "studentDataStore.init") });
      initPromise = null;
    }
  })();
  return initPromise;
}

export function resetStudentDataStore() {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels = [];
  initPromise = null;
  state = initialState;
  listeners.forEach((l) => l());
}

export function getStudentDataSnapshot(): StudentDataState {
  return state;
}

export function subscribeStudentData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") resetStudentDataStore();
  });
}
