import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  getAdminUsers,
  getProdi,
  type AdminUserWithProdi,
  type Prodi,
} from "./superadmin-queries";

export interface SuperadminDataState {
  currentUser: User | null;
  admins: AdminUserWithProdi[];
  prodis: Prodi[];
  loading: boolean;
  error: string | null;
}

const initialState: SuperadminDataState = {
  currentUser: null,
  admins: [],
  prodis: [],
  loading: false,
  error: null,
};

let state: SuperadminDataState = initialState;
let initPromise: Promise<void> | null = null;
let channel: RealtimeChannel | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<SuperadminDataState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const sortByName = <T extends { name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name));

function subscribeRealtime() {
  if (channel) return;

  // HMR guard: drop any leftover channel from a previous module instance.
  supabase.getChannels().forEach((ch) => {
    if (ch.topic.replace(/^realtime:/, "") === "superadmin-realtime") {
      supabase.removeChannel(ch);
    }
  });

  channel = supabase
    .channel("superadmin-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "admin_users" },
      async (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({ admins: state.admins.filter((a) => a.id !== id) });
          return;
        }
        // INSERT/UPDATE: realtime payload omits joined prodi — refetch the row.
        const id = (payload.new as { id?: string }).id;
        if (!id) return;
        const { data } = await supabase
          .from("admin_users")
          .select(`*, prodi ( name, integration_status )`)
          .eq("id", id)
          .single();
        if (!data) return;
        const row = data as AdminUserWithProdi;
        if (row.deleted_at) {
          setState({ admins: state.admins.filter((a) => a.id !== row.id) });
          return;
        }
        const idx = state.admins.findIndex((a) => a.id === row.id);
        if (idx === -1) {
          setState({ admins: sortByName([...state.admins, row]) });
        } else {
          const next = [...state.admins];
          next[idx] = row;
          setState({ admins: next });
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "prodi" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setState({ prodis: state.prodis.filter((p) => p.id !== id) });
          return;
        }
        const row = payload.new as Prodi;
        const idx = state.prodis.findIndex((p) => p.id === row.id);
        let nextProdis: Prodi[];
        if (idx === -1) {
          nextProdis = sortByName([...state.prodis, row]);
        } else {
          nextProdis = [...state.prodis];
          nextProdis[idx] = row;
        }
        // Keep joined prodi snapshot on admin rows in sync.
        const nextAdmins = state.admins.map((a) =>
          a.prodi_id === row.id
            ? { ...a, prodi: { name: row.name, integration_status: row.integration_status } }
            : a,
        );
        setState({ prodis: nextProdis, admins: nextAdmins });
      },
    )
    .subscribe();
}

/**
 * Idempotent init: fetches admins, prodis, and the current user, then
 * subscribes to realtime. Safe to call multiple times.
 */
export function ensureSuperadminDataInitialized(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    setState({ loading: true, error: null });
    try {
      const [admins, prodis, { data: { user } }] = await Promise.all([
        getAdminUsers(),
        getProdi(),
        supabase.auth.getUser(),
      ]);
      currentUserId = user?.id ?? currentUserId;
      setState({ admins, prodis, currentUser: user, loading: false, error: null });
      subscribeRealtime();
    } catch (e) {
      setState({ loading: false, error: (e as Error).message });
      initPromise = null;
    }
  })();
  return initPromise;
}

export function resetSuperadminDataStore() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  initPromise = null;
  state = initialState;
  listeners.forEach((l) => l());
}

export function getSuperadminDataSnapshot(): SuperadminDataState {
  return state;
}

export function subscribeSuperadminData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const superadminDataMutators = {
  setAdmins(updater: (prev: AdminUserWithProdi[]) => AdminUserWithProdi[]) {
    setState({ admins: updater(state.admins) });
  },
  setProdis(updater: (prev: Prodi[]) => Prodi[]) {
    setState({ prodis: updater(state.prodis) });
  },
};

// Auth user the cache currently holds data for. Lets us ignore the redundant
// SIGNED_IN events auth-js re-emits on tab refocus.
let currentUserId: string | null = null;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      resetSuperadminDataStore();
      return;
    }
    // INITIAL_SESSION (page load / refresh) and SIGNED_IN (login) drive the
    // load. auth-js re-emits SIGNED_IN on tab refocus, so only (re)load when
    // the user id actually changes.
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== currentUserId) {
        currentUserId = uid;
        resetSuperadminDataStore();
        ensureSuperadminDataInitialized().catch(() => {});
      }
    }
  });
}
