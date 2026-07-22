import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  getApplications,
  getCloMatkulMap,
  getCurrentHrProfile,
  getJobs,
  getProdiInfo,
  getReqBestClos,
  getTalentCourseGrades,
  getTalentGrades,
  getTalentInvitations,
  getTalentStudents,
  type ApplicationWithDetails,
  type Company,
  type HRProfileWithCompany,
  type JobWithSkills,
  type ProdiInfo,
  type ReqBestCloRow,
  type TalentCLOGrade,
  type TalentCourseGrade,
  type TalentInvitation,
  type TalentStudent,
} from "./hr-queries";
import { reportHrError } from "./hrErrors";
import { clearRoleCache, resolveUserRole } from "./currentRole";

export interface HRDataState {
  hr: HRProfileWithCompany | null;
  company: Company | null;
  jobs: JobWithSkills[];
  applications: ApplicationWithDetails[];
  talents: TalentStudent[];
  talentGrades: TalentCLOGrade[];
  // Final per-matkul grades, for talents whose prodi grades per mata kuliah
  // (and as the alternate view for those that grade per CLO).
  talentCourseGrades: TalentCourseGrade[];
  // req_best_clo rows for this HR's jobs — the inputs used to reproduce the
  // student-side match score (see lib/hr-match.ts).
  reqBestClos: ReqBestCloRow[];
  // clo_id → matkul_id, needed to score on the course basis.
  cloMatkul: Record<string, string>;
  invitations: TalentInvitation[];
  prodiInfo: Record<string, ProdiInfo>;
  loading: boolean;
  error: string | null;
}

const initialState: HRDataState = {
  hr: null,
  company: null,
  jobs: [],
  applications: [],
  talents: [],
  talentGrades: [],
  talentCourseGrades: [],
  reqBestClos: [],
  cloMatkul: {},
  invitations: [],
  prodiInfo: {},
  loading: false,
  error: null,
};

let state: HRDataState = initialState;
let initPromise: Promise<void> | null = null;
let channels: RealtimeChannel[] = [];
const listeners = new Set<() => void>();
// Auth user the cache currently holds data for. Used to ignore the redundant
// SIGNED_IN events auth-js re-emits on tab refocus (see the listener below).
let currentUserId: string | null = null;

function setState(patch: Partial<HRDataState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribeRealtime(hrId: string, companyId: string | null) {
  if (channels.length > 0) return;

  // HMR / repeated-init guard.
  const topics = [
    `hr-jobs-${hrId}`,
    `hr-applications-${hrId}`,
    `hr-invitations-${hrId}`,
    `hr-profile-${hrId}`,
    `hr-students-${hrId}`,
  ];
  if (companyId) topics.push(`hr-company-${companyId}`);
  supabase.getChannels().forEach((ch) => {
    if (topics.includes(ch.topic.replace(/^realtime:/, ""))) {
      supabase.removeChannel(ch);
    }
  });

  // Jobs: scoped by hr_id.
  const jobsCh = supabase
    .channel(`hr-jobs-${hrId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "jobs", filter: `hr_id=eq.${hrId}` },
      async () => {
        try {
          const next = await getJobs({ hrId });
          // Job edits also replace requirements (→ new req_best_clo rows), so
          // refresh the scoring inputs alongside the jobs themselves.
          const rbc = await getReqBestClos(next.map((j) => j.id)).catch(
            () => [] as ReqBestCloRow[],
          );
          setState({ jobs: next, reqBestClos: rbc });
        } catch {
          /* ignore */
        }
      },
    )
    .subscribe();

  // Applications: not directly filterable by hr_id (column lives on jobs).
  // Subscribe broad, refilter by current job set.
  const appsCh = supabase
    .channel(`hr-applications-${hrId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "applications" },
      async (payload) => {
        const row = (payload.new ?? payload.old) as { job_id?: string } | null;
        const jobIds = new Set(state.jobs.map((j) => j.id));
        if (!row?.job_id || !jobIds.has(row.job_id)) return;
        try {
          const next = await getApplications({ jobIds: [...jobIds] });
          setState({ applications: next });
        } catch {
          /* ignore */
        }
      },
    )
    .subscribe();

  // Invitations: scoped by hr_id.
  const invCh = supabase
    .channel(`hr-invitations-${hrId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "talent_invitations", filter: `hr_id=eq.${hrId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({ invitations: state.invitations.filter((i) => i.id !== id) });
          return;
        }
        const row = payload.new as TalentInvitation;
        const idx = state.invitations.findIndex((i) => i.id === row.id);
        if (idx === -1) {
          setState({ invitations: [...state.invitations, row] });
        } else {
          const next = [...state.invitations];
          next[idx] = row;
          setState({ invitations: next });
        }
      },
    )
    .subscribe();

  // HR profile updates.
  const hrCh = supabase
    .channel(`hr-profile-${hrId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "hr_profiles", filter: `id=eq.${hrId}` },
      (payload) => {
        const row = payload.new as { name?: string; position?: string | null };
        if (!state.hr) return;
        setState({ hr: { ...state.hr, ...row } });
      },
    )
    .subscribe();

  // Students (talent pool): broad subscription, recompute on any change.
  const studentsCh = supabase
    .channel(`hr-students-${hrId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "students" },
      async () => {
        try {
          const talents = await getTalentStudents();
          const talentIds = talents.map((t) => t.id);
          const [grades, courseGrades] = await Promise.all([
            getTalentGrades(talentIds),
            getTalentCourseGrades(talentIds).catch(() => [] as TalentCourseGrade[]),
          ]);
          setState({ talents, talentGrades: grades, talentCourseGrades: courseGrades });
        } catch {
          /* ignore */
        }
      },
    )
    .subscribe();

  channels = [jobsCh, appsCh, invCh, hrCh, studentsCh];

  // Company updates (only if company exists).
  if (companyId) {
    const companyCh = supabase
      .channel(`hr-company-${companyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "companies", filter: `id=eq.${companyId}` },
        (payload) => {
          const row = payload.new as Company;
          setState({
            company: row,
            hr: state.hr ? { ...state.hr, company: row } : state.hr,
          });
        },
      )
      .subscribe();
    channels.push(companyCh);
  }
}

export function ensureHrDataInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const hr = await getCurrentHrProfile();
      // Keep the tracked user in sync for callers that init directly (login /
      // registration prefetch), so the SIGNED_IN that follows is treated as a
      // redundant re-fire and does not trigger a second reload.
      currentUserId = hr.user_id ?? currentUserId;

      const [jobs, talents, prodiInfo] = await Promise.all([
        getJobs({ hrId: hr.id }),
        getTalentStudents().catch(() => [] as TalentStudent[]),
        getProdiInfo().catch(() => ({} as Record<string, ProdiInfo>)),
      ]);

      const jobIds = jobs.map((j) => j.id);
      const talentIds = talents.map((t) => t.id);
      const [
        applications,
        invitations,
        talentGrades,
        talentCourseGrades,
        reqBestClos,
        cloMatkul,
      ] = await Promise.all([
        jobIds.length
          ? getApplications({ jobIds }).catch(() => [] as ApplicationWithDetails[])
          : Promise.resolve([] as ApplicationWithDetails[]),
        getTalentInvitations(hr.id).catch(() => [] as TalentInvitation[]),
        getTalentGrades(talentIds).catch(() => [] as TalentCLOGrade[]),
        getTalentCourseGrades(talentIds).catch(() => [] as TalentCourseGrade[]),
        getReqBestClos(jobIds).catch(() => [] as ReqBestCloRow[]),
        getCloMatkulMap().catch(() => ({} as Record<string, string>)),
      ]);

      setState({
        hr,
        company: hr.company,
        jobs,
        applications,
        talents,
        talentGrades,
        talentCourseGrades,
        reqBestClos,
        cloMatkul,
        invitations,
        prodiInfo,
        loading: false,
        error: null,
      });
      subscribeRealtime(hr.id, hr.company?.id ?? null);
    } catch (e) {
      setState({ loading: false, error: reportHrError(e, "hrDataStore.init") });
      initPromise = null;
    }
  })();
  return initPromise;
}

export function resetHrDataStore() {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels = [];
  initPromise = null;
  state = initialState;
  listeners.forEach((l) => l());
}

export function getHrDataSnapshot(): HRDataState {
  return state;
}

export function subscribeHrData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const hrDataMutators = {
  setHr(updater: (prev: HRProfileWithCompany | null) => HRProfileWithCompany | null) {
    setState({ hr: updater(state.hr) });
  },
  setCompany(updater: (prev: Company | null) => Company | null) {
    const next = updater(state.company);
    setState({
      company: next,
      hr: state.hr ? { ...state.hr, company: next } : state.hr,
    });
  },
  setJobs(updater: (prev: JobWithSkills[]) => JobWithSkills[]) {
    setState({ jobs: updater(state.jobs) });
  },
  setApplications(
    updater: (prev: ApplicationWithDetails[]) => ApplicationWithDetails[],
  ) {
    setState({ applications: updater(state.applications) });
  },
  setInvitations(updater: (prev: TalentInvitation[]) => TalentInvitation[]) {
    setState({ invitations: updater(state.invitations) });
  },
};

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      clearRoleCache();
      resetHrDataStore();
      return;
    }

    // INITIAL_SESSION (page load / refresh) and SIGNED_IN (login or
    // just-completed registration) both carry a session. Crucially, auth-js
    // ALSO re-emits SIGNED_IN every time the tab regains visibility
    // (_recoverAndRefresh on visibilitychange), which previously wiped the
    // cache and re-showed "Memuat data" on every tab switch. So load only when
    // the user id is new — redundant re-fires for the same user are ignored.
    // TOKEN_REFRESHED / USER_UPDATED leave the cached data valid → ignore.
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== currentUserId) {
        currentUserId = uid;
        resetHrDataStore();
        // Show the skeleton immediately while we confirm the role, then load
        // ONLY if this user is actually an HR. Other roles must not trigger
        // getCurrentHrProfile() — that would throw the "profil HR" error.
        setState({ loading: true });
        resolveUserRole(uid).then((role) => {
          if (currentUserId !== uid) return; // signed out / switched meanwhile
          if (role === "hr") {
            ensureHrDataInitialized().catch(() => {});
          } else {
            setState({ loading: false });
          }
        });
      }
    }
  });
}
