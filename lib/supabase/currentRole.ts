import { supabase } from "./client";
import type { UserRole } from "./auth";

// Resolves (and caches per auth user) the role for the current session so each
// per-role data store can decide whether IT is the store that should load.
//
// Why this exists: every data store registers its own `onAuthStateChange`
// listener, and `auth.ts` (imported by useRequireRole → every protected layout,
// and by the login page) pulls in all four stores. So on every login ALL four
// listeners fire. Without a role check each store would eagerly call its
// getCurrentXProfile(), and the three stores that don't match the user's single
// role would throw "Akun … belum ditautkan ke data X". Gating init on the
// resolved role removes that cross-contamination entirely.
//
// The result is cached per user id, so the four stores reacting to the same
// SIGNED_IN event share a single user_roles query.

let cachedUserId: string | null = null;
let cachedRole: Promise<UserRole | null> | null = null;

export function resolveUserRole(userId: string): Promise<UserRole | null> {
  if (cachedUserId === userId && cachedRole) return cachedRole;
  cachedUserId = userId;
  cachedRole = (async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) {
      // Don't cache a failed lookup — a transient error shouldn't permanently
      // pin the role to null for this user.
      if (cachedUserId === userId) {
        cachedUserId = null;
        cachedRole = null;
      }
      return null;
    }
    return data.role as UserRole;
  })();
  return cachedRole;
}

/** Forget the cached role. Call on sign out so the next user re-resolves. */
export function clearRoleCache() {
  cachedUserId = null;
  cachedRole = null;
}
