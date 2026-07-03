import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  getAllCLOs,
  getMatkul,
  getStudents,
  type CLO,
  type Matkul,
  type Student,
  type StudentCLO,
} from "./admin-queries";
import { reportAdminError } from "./adminErrors";
import type { AdminProdiInfo } from "./useAdminProdi";
import { clearRoleCache, resolveUserRole } from "./currentRole";

export interface AdminDataState {
  adminCtx: AdminProdiInfo | null;
  students: Student[];
  matkul: Matkul[];
  clos: CLO[];
  studentClos: StudentCLO[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminDataState = {
  adminCtx: null,
  students: [],
  matkul: [],
  clos: [],
  studentClos: [],
  loading: false,
  error: null,
};

let state: AdminDataState = initialState;
let initPromise: Promise<void> | null = null;
let channels: RealtimeChannel[] = [];
const listeners = new Set<() => void>();

function setState(patch: Partial<AdminDataState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const sortByNim = (list: Student[]) =>
  [...list].sort((a, b) => a.nim.localeCompare(b.nim));
const sortByKode = (list: Matkul[]) =>
  [...list].sort((a, b) => a.kode.localeCompare(b.kode));

async function resolveAdminCtx(): Promise<AdminProdiInfo> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Tidak ada sesi.");
  const { data, error } = await supabase
    .from("admin_users")
    .select(`name, email, prodi:prodi_id ( id, name, fakultas )`)
    .eq("user_id", session.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.prodi) throw new Error("Akun admin ini belum ditautkan ke prodi.");
  const prodi = data.prodi as unknown as { id: string; name: string; fakultas: string | null };
  return {
    prodi_id: prodi.id,
    prodi_name: prodi.name,
    admin_name: data.name,
    fakultas: prodi.fakultas,
    email: data.email,
  };
}

function subscribeRealtime(prodiId: string) {
  if (channels.length > 0) return;

  // HMR / repeated init guard: the `supabase` client is a module-level
  // singleton that survives store-module reloads in dev. If a previous run
  // already subscribed to a channel with the same name, calling
  // `supabase.channel(name)` returns the *existing* (already-subscribed)
  // instance — and any `.on(...)` call on it throws "cannot add
  // postgres_changes callbacks after subscribe()". Tear them down first.
  const topics = [
    `admin-students-${prodiId}`,
    `admin-matkul-${prodiId}`,
    `admin-clos-${prodiId}`,
    `admin-student-clos-${prodiId}`,
  ];
  supabase.getChannels().forEach((ch) => {
    if (topics.includes(ch.topic.replace(/^realtime:/, ""))) {
      supabase.removeChannel(ch);
    }
  });

  // Students: filterable by prodi_id directly.
  const studentsCh = supabase
    .channel(`admin-students-${prodiId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "students", filter: `prodi_id=eq.${prodiId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({ students: state.students.filter((s) => s.id !== id) });
          return;
        }
        const row = payload.new as Student;
        const idx = state.students.findIndex((s) => s.id === row.id);
        if (idx === -1) {
          setState({ students: sortByNim([...state.students, row]) });
        } else {
          const next = [...state.students];
          next[idx] = row;
          setState({ students: next });
        }
      },
    )
    .subscribe();

  // Matkul: filterable by prodi_id directly.
  const matkulCh = supabase
    .channel(`admin-matkul-${prodiId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matkul", filter: `prodi_id=eq.${prodiId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({
            matkul: state.matkul.filter((m) => m.id !== id),
            // Cascade: drop clos/studentClos that referenced this matkul.
            clos: state.clos.filter((c) => c.matkul_id !== id),
          });
          return;
        }
        const row = payload.new as Matkul;
        const idx = state.matkul.findIndex((m) => m.id === row.id);
        if (idx === -1) {
          setState({ matkul: sortByKode([...state.matkul, row]) });
        } else {
          const next = [...state.matkul];
          next[idx] = row;
          setState({ matkul: next });
        }
      },
    )
    .subscribe();

  // CLOs: junction-ish table — no prodi_id column. Subscribe broad, filter
  // client-side using our matkul list at event time.
  const closCh = supabase
    .channel(`admin-clos-${prodiId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clos" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({ clos: state.clos.filter((c) => c.id !== id) });
          return;
        }
        const row = payload.new as CLO;
        const ourMatkul = new Set(state.matkul.map((m) => m.id));
        if (!ourMatkul.has(row.matkul_id)) return;
        const idx = state.clos.findIndex((c) => c.id === row.id);
        if (idx === -1) {
          setState({ clos: [...state.clos, row] });
        } else {
          const next = [...state.clos];
          next[idx] = row;
          setState({ clos: next });
        }
      },
    )
    .subscribe();

  // student_clos: junction. Scope client-side by clo_id ∈ our clos.
  const studentClosCh = supabase
    .channel(`admin-student-clos-${prodiId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "student_clos" },
      (payload) => {
        const isOurs = (cloId: string) =>
          state.clos.some((c) => c.id === cloId);

        if (payload.eventType === "DELETE") {
          const old = payload.old as { student_id?: string; clo_id?: string };
          if (!old.student_id || !old.clo_id) return;
          setState({
            studentClos: state.studentClos.filter(
              (sc) => !(sc.student_id === old.student_id && sc.clo_id === old.clo_id),
            ),
          });
          return;
        }
        const row = payload.new as StudentCLO;
        if (!isOurs(row.clo_id)) return;
        const idx = state.studentClos.findIndex(
          (sc) => sc.student_id === row.student_id && sc.clo_id === row.clo_id,
        );
        if (idx === -1) {
          setState({ studentClos: [...state.studentClos, row] });
        } else {
          const next = [...state.studentClos];
          next[idx] = row;
          setState({ studentClos: next });
        }
      },
    )
    .subscribe();

  channels = [studentsCh, matkulCh, closCh, studentClosCh];
}

async function fetchStudentClosForMatkul(matkulIds: string[]): Promise<StudentCLO[]> {
  if (matkulIds.length === 0) return [];
  // Get CLO ids for our matkul, then student_clos rows for those CLOs.
  const { data: closRows, error: e1 } = await supabase
    .from("clos")
    .select("id")
    .in("matkul_id", matkulIds);
  if (e1) throw e1;
  const cloIds = (closRows ?? []).map((c) => c.id);
  if (cloIds.length === 0) return [];
  const { data, error } = await supabase
    .from("student_clos")
    .select("student_id, clo_id, grade")
    .in("clo_id", cloIds);
  if (error) throw error;
  return (data ?? []) as StudentCLO[];
}

/**
 * Idempotent init: fetches admin context + students + matkul + clos +
 * student_clos and subscribes to realtime. Safe to call multiple times — only
 * the first call does work.
 */
export function ensureAdminDataInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const adminCtx = await resolveAdminCtx();
      const [students, matkul, allClos] = await Promise.all([
        getStudents(adminCtx.prodi_id),
        getMatkul(adminCtx.prodi_id),
        getAllCLOs(),
      ]);
      const matkulIds = new Set(matkul.map((m) => m.id));
      const scopedClos = allClos.filter((c) => matkulIds.has(c.matkul_id));
      const studentClos = await fetchStudentClosForMatkul([...matkulIds]);
      setState({
        adminCtx,
        students,
        matkul,
        clos: scopedClos,
        studentClos,
        loading: false,
        error: null,
      });
      subscribeRealtime(adminCtx.prodi_id);
    } catch (e) {
      setState({ loading: false, error: reportAdminError(e, "adminDataStore.init") });
      initPromise = null;
    }
  })();
  return initPromise;
}

/** Clear store and unsubscribe. Called on sign out. */
export function resetAdminDataStore() {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels = [];
  initPromise = null;
  state = initialState;
  listeners.forEach((l) => l());
}

export function getAdminDataSnapshot(): AdminDataState {
  return state;
}

export function subscribeAdminData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mutators used by pages for optimistic updates. */
export const adminDataMutators = {
  setStudents(updater: (prev: Student[]) => Student[]) {
    setState({ students: updater(state.students) });
  },
  setMatkul(updater: (prev: Matkul[]) => Matkul[]) {
    setState({ matkul: updater(state.matkul) });
  },
  setClos(updater: (prev: CLO[]) => CLO[]) {
    setState({ clos: updater(state.clos) });
  },
};

// Auth user the cache currently holds data for. Lets us ignore the redundant
// SIGNED_IN events auth-js re-emits on tab refocus.
let currentUserId: string | null = null;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      clearRoleCache();
      resetAdminDataStore();
      return;
    }
    // INITIAL_SESSION (page load / refresh) and SIGNED_IN (login) drive the
    // load. auth-js re-emits SIGNED_IN on tab refocus, so only (re)load when
    // the user id actually changes.
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== currentUserId) {
        currentUserId = uid;
        resetAdminDataStore();
        // Show the skeleton immediately while we confirm the role, then load
        // ONLY if this user is actually an admin. Other roles must not trigger
        // resolveAdminCtx() — that would throw "belum ditautkan ke prodi".
        setState({ loading: true });
        resolveUserRole(uid).then((role) => {
          if (currentUserId !== uid) return; // signed out / switched meanwhile
          if (role === "admin") {
            ensureAdminDataInitialized().catch(() => {});
          } else {
            setState({ loading: false });
          }
        });
      }
    }
  });
}
