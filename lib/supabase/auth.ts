import { supabase } from "./client";
import { ensureAdminDataInitialized } from "./adminDataStore";
import { ensureHrDataInitialized } from "./hrDataStore";
import { ensureStudentDataInitialized } from "./studentDataStore";
import { ensureSuperadminDataInitialized } from "./superadminDataStore";

export type UserRole = "student" | "admin" | "hr" | "superadmin";

export const roleDashboard: Record<UserRole, string> = {
  superadmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  hr: "/hr/dashboard",
  student: "/student/dashboard",
};

export const roleLabel: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin Prodi",
  hr: "HR / Rekruter",
  student: "Mahasiswa",
};

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek inbox Anda.";
  if (m.includes("user not found")) return "Akun tidak ditemukan.";
  if (m.includes("rate limit")) return "Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.";
  if (m.includes("network")) return "Gagal terhubung ke server. Periksa koneksi internet.";
  return message;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error.message));
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data.role as UserRole;
}

/**
 * Sign in with email + password and resolve the user's role. Throws a
 * user-friendly Error when credentials are wrong, the role row is missing,
 * or (when `expectedRole` is provided) the role does not match.
 */
export async function signInAndResolveRole(
  email: string,
  password: string,
  expectedRole?: UserRole,
): Promise<{ role: UserRole; redirectTo: string }> {
  await signIn(email, password);
  const role = await getCurrentUserRole();
  if (!role) {
    await signOut().catch(() => {});
    throw new Error(
      "Login berhasil, namun akun ini belum memiliki role. Hubungi superadmin.",
    );
  }
  if (expectedRole && role !== expectedRole) {
    await signOut().catch(() => {});
    throw new Error(
      `Akun ini terdaftar sebagai ${roleLabel[role]}, bukan ${roleLabel[expectedRole]}.`,
    );
  }
  // Prefetch role-scoped data so dashboard renders without a loading state.
  if (role === "admin") {
    ensureAdminDataInitialized().catch(() => {});
  } else if (role === "superadmin") {
    ensureSuperadminDataInitialized().catch(() => {});
  } else if (role === "student") {
    ensureStudentDataInitialized().catch(() => {});
  } else if (role === "hr") {
    ensureHrDataInitialized().catch(() => {});
  }
  return { role, redirectTo: roleDashboard[role] };
}

export function getDisplayName(user: { email?: string; user_metadata?: { full_name?: string } } | null): string {
  if (!user) return "";
  if (user.user_metadata?.full_name) return user.user_metadata.full_name as string;
  return user.email?.split("@")[0] ?? "";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
