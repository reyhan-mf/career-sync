import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  getActiveJobs,
  getCurrentStudentProfile,
  getJobMatchScores,
  getMyApplications,
  getStudentTranscript,
  type CourseRecord,
  type JobListing,
  type StudentApplication,
  type StudentProfile,
} from "./student-queries";
import {
  getMyInvitations,
  type StudentInvitation,
} from "./invitation-queries";
import type { StudentCLO } from "./admin-queries";
import type { AssessmentMode } from "./superadmin-queries";
import { reportStudentError } from "./studentErrors";
import { clearRoleCache, resolveUserRole } from "./currentRole";

export interface StudentDataState {
  profile: StudentProfile | null;
  transcript: CourseRecord[];
  jobs: JobListing[];
  applications: StudentApplication[];
  invitations: StudentInvitation[];
  // { job_id: match score 0-100 }, computed in Postgres from grades + CLO/req
  // similarity. Empty until loaded; absent job_id ⇒ no score yet.
  matchScores: Record<string, number>;
  // Which grade the scores above are weighted by. Initialised from the prodi's
  // assessment_mode; the student may flip it to inspect the other basis, which
  // refetches every score so the list, the badges and the per-requirement
  // breakdown never disagree.
  gradeBasis: AssessmentMode;
  // True while the scores are being refetched under a newly chosen basis, so
  // screens can show a skeleton instead of numbers from the previous basis.
  matchScoresLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: StudentDataState = {
  profile: null,
  transcript: [],
  jobs: [],
  applications: [],
  invitations: [],
  matchScores: {},
  gradeBasis: "clo",
  matchScoresLoading: false,
  loading: false,
  error: null,
};

let state: StudentDataState = initialState;
let initPromise: Promise<void> | null = null;
let channels: RealtimeChannel[] = [];
const listeners = new Set<() => void>();
// Auth user the cache currently holds data for. Lets us ignore the redundant
// SIGNED_IN events auth-js re-emits on tab refocus (see the listener below).
let currentUserId: string | null = null;

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
  // Grades changed → match scores are stale. Refetch (debounced — grades often
  // arrive in bursts when a transcript is imported).
  scheduleMatchScoreRefresh();
}

let matchRefreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMatchScoreRefresh() {
  const studentId = state.profile?.student.id;
  if (!studentId) return;
  if (matchRefreshTimer) clearTimeout(matchRefreshTimer);
  matchRefreshTimer = setTimeout(() => {
    matchRefreshTimer = null;
    getJobMatchScores(studentId, state.gradeBasis)
      .then((matchScores) => setState({ matchScores }))
      .catch(() => {});
  }, 800);
}

// A student_matkul change moves the per-matkul final grade, which the transcript
// shows and the 'course' basis scores against. The transcript is one small
// query, so refetch it wholesale rather than patching rows by hand.
let transcriptRefreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleTranscriptRefresh() {
  const profile = state.profile;
  if (!profile) return;
  if (transcriptRefreshTimer) clearTimeout(transcriptRefreshTimer);
  transcriptRefreshTimer = setTimeout(() => {
    transcriptRefreshTimer = null;
    getStudentTranscript(profile.student.id, profile.student.prodi_id)
      .then((transcript) => setState({ transcript }))
      .catch(() => {});
  }, 400);
  scheduleMatchScoreRefresh();
}

// Realtime application payloads don't include the joined `jobs` row, so rather
// than patch partial rows we refetch the whole (small) list on any change.
// Debounced because a status change + updated_at can arrive close together.
let appsRefreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleApplicationsRefresh() {
  const studentId = state.profile?.student.id;
  if (!studentId) return;
  if (appsRefreshTimer) clearTimeout(appsRefreshTimer);
  appsRefreshTimer = setTimeout(() => {
    appsRefreshTimer = null;
    getMyApplications(studentId)
      .then((applications) => setState({ applications }))
      .catch(() => {});
  }, 400);
}

let invitesRefreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleInvitationsRefresh() {
  const studentId = state.profile?.student.id;
  if (!studentId) return;
  if (invitesRefreshTimer) clearTimeout(invitesRefreshTimer);
  invitesRefreshTimer = setTimeout(() => {
    invitesRefreshTimer = null;
    getMyInvitations(studentId)
      .then((invitations) => setState({ invitations }))
      .catch(() => {});
  }, 400);
}

function subscribeRealtime(studentId: string) {
  if (channels.length > 0) return;

  // HMR guard.
  const ourTopics = [
    `student-self-${studentId}`,
    `student-grades-${studentId}`,
    `student-course-grades-${studentId}`,
    `student-apps-${studentId}`,
    `student-invites-${studentId}`,
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

  // Watch this student's final per-matkul grades.
  const courseGradesCh = supabase
    .channel(`student-course-grades-${studentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "student_matkul", filter: `student_id=eq.${studentId}` },
      () => scheduleTranscriptRefresh(),
    )
    .subscribe();

  // Watch this student's applications (status changes from HR, etc.)
  const appsCh = supabase
    .channel(`student-apps-${studentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "applications", filter: `student_id=eq.${studentId}` },
      () => scheduleApplicationsRefresh(),
    )
    .subscribe();

  // Watch talent invitations addressed to this student.
  const invitesCh = supabase
    .channel(`student-invites-${studentId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "talent_invitations", filter: `student_id=eq.${studentId}` },
      () => scheduleInvitationsRefresh(),
    )
    .subscribe();

  channels = [selfCh, gradesCh, courseGradesCh, appsCh, invitesCh];
}

export function ensureStudentDataInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const profile = await getCurrentStudentProfile();
      currentUserId = profile.student.user_id ?? currentUserId;
      // The prodi decides the default basis: a prodi that only records final
      // course grades must not open on an all-zero CLO-weighted ranking.
      const gradeBasis: AssessmentMode = profile.prodi?.assessment_mode ?? "clo";
      const [transcript, jobs, applications, invitations, matchScores] = await Promise.all([
        getStudentTranscript(profile.student.id, profile.student.prodi_id),
        getActiveJobs().catch(() => [] as JobListing[]),
        getMyApplications(profile.student.id).catch(() => [] as StudentApplication[]),
        getMyInvitations(profile.student.id).catch(() => [] as StudentInvitation[]),
        getJobMatchScores(profile.student.id, gradeBasis).catch(() => ({}) as Record<string, number>),
      ]);
      setState({ profile, transcript, jobs, applications, invitations, matchScores, gradeBasis, loading: false, error: null });
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

export const studentDataMutators = {
  // Optimistic add after a successful applyToJob — realtime then reconciles.
  addApplication(app: StudentApplication) {
    if (state.applications.some((a) => a.id === app.id)) return;
    setState({ applications: [app, ...state.applications] });
  },
  setApplications(updater: (prev: StudentApplication[]) => StudentApplication[]) {
    setState({ applications: updater(state.applications) });
  },
  setInvitations(updater: (prev: StudentInvitation[]) => StudentInvitation[]) {
    setState({ invitations: updater(state.invitations) });
  },
  // Reconcile a single job's match score (e.g. the live value computed on the
  // job-detail page) so the job-matching list badge stays in sync.
  setMatchScore(jobId: string, score: number) {
    if (state.matchScores[jobId] === score) return;
    setState({ matchScores: { ...state.matchScores, [jobId]: score } });
  },
  /**
   * Switch which grade the match scores are weighted by. Every score is
   * refetched under the new basis — showing a mix of CLO-weighted and
   * course-weighted numbers in one ranked list would be meaningless. The old
   * scores are cleared first so no stale badge lingers during the refetch.
   */
  setGradeBasis(mode: AssessmentMode) {
    if (state.gradeBasis === mode) return;
    const studentId = state.profile?.student.id;
    setState({ gradeBasis: mode, matchScores: {}, matchScoresLoading: !!studentId });
    if (!studentId) return;
    getJobMatchScores(studentId, mode)
      .then((matchScores) => {
        // Ignore a response that lost the race with a newer basis switch —
        // that switch owns the loading flag now.
        if (state.gradeBasis !== mode) return;
        setState({ matchScores, matchScoresLoading: false });
      })
      .catch(() => {
        if (state.gradeBasis !== mode) return;
        setState({ matchScoresLoading: false });
      });
  },
};

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      clearRoleCache();
      resetStudentDataStore();
      return;
    }
    // INITIAL_SESSION (page load / refresh) and SIGNED_IN (login) both carry a
    // session. auth-js also re-emits SIGNED_IN on every tab refocus, so only
    // (re)load when the user id actually changes — redundant re-fires are
    // ignored. This also drives the first load (the provider no longer does).
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== currentUserId) {
        currentUserId = uid;
        resetStudentDataStore();
        // Show the skeleton immediately while we confirm the role, then load
        // ONLY if this user is actually a student. Other roles must not trigger
        // getCurrentStudentProfile() — that would throw "belum ditautkan".
        setState({ loading: true });
        resolveUserRole(uid).then((role) => {
          if (currentUserId !== uid) return; // signed out / switched meanwhile
          if (role === "student") {
            ensureStudentDataInitialized().catch(() => {});
          } else {
            setState({ loading: false });
          }
        });
      }
    }
  });
}
