import { supabase } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Prodi {
  id: string;
  name: string;
  fakultas: string | null;
  integration_status: string | null;
  created_at: string | null;
}

export interface AdminUser {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  prodi_id: string | null;
  deleted_at: string | null;
}

export interface AdminUserWithProdi extends AdminUser {
  prodi: { name: string; integration_status: string | null } | null;
}

// ─── Prodi ────────────────────────────────────────────────────────────────────

export async function getProdi() {
  const { data, error } = await supabase
    .from("prodi")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Prodi[];
}

export async function createProdi(prodi: Omit<Prodi, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("prodi")
    .insert(prodi)
    .select()
    .single();
  if (error) throw error;
  return data as Prodi;
}

export async function updateProdi(id: string, updates: Partial<Omit<Prodi, "id" | "created_at">>) {
  const { data, error } = await supabase
    .from("prodi")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Prodi;
}

export async function deleteProdi(id: string) {
  const { error } = await supabase.from("prodi").delete().eq("id", id);
  if (error) throw error;
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select(`*, prodi ( name, integration_status )`)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data as AdminUserWithProdi[];
}

export async function createAdminUser(adminUser: {
  name: string;
  email: string;
  password: string;
  prodi_id: string;
}): Promise<AdminUserWithProdi> {
  const { data, error } = await supabase.functions.invoke("provision-admin", {
    body: adminUser,
  });
  if (error) {
    const fnMsg = (data as { error?: string } | null)?.error;
    throw new Error(fnMsg ?? error.message);
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return (data as { admin: AdminUserWithProdi }).admin;
}

// Reset an existing prodi admin's login password. Runs through the
// `reset-admin-password` edge function because changing another user's auth
// password requires the service role — the same privileged pattern as
// `provision-admin`. `adminId` is the admin_users row id (the function resolves
// its auth user_id server-side).
export async function resetAdminPassword(adminId: string, password: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("reset-admin-password", {
    body: { admin_id: adminId, password },
  });
  if (error) {
    const fnMsg = (data as { error?: string } | null)?.error;
    throw new Error(fnMsg ?? error.message);
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
}

export async function updateAdminUser(
  id: string,
  updates: { name?: string; prodi_id?: string | null },
) {
  const { data, error } = await supabase
    .from("admin_users")
    .update(updates)
    .eq("id", id)
    .select(`*, prodi ( name, integration_status )`)
    .single();
  if (error) throw error;
  return data as AdminUserWithProdi;
}

export async function softDeleteAdminUser(id: string) {
  const { error } = await supabase
    .from("admin_users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
