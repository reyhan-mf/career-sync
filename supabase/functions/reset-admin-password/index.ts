import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResetPayload {
  admin_id?: string;
  password?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Sesi tidak ditemukan." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify the caller with their own JWT.
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) {
    return json({ error: "Sesi tidak valid." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRole);

  // Only superadmins may reset a prodi admin's password.
  const { data: roleRow, error: roleLookupErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "superadmin")
    .maybeSingle();
  if (roleLookupErr) {
    return json({ error: `Gagal verifikasi role: ${roleLookupErr.message}` }, 500);
  }
  if (!roleRow) {
    return json({ error: "Hanya superadmin yang boleh mereset password admin." }, 403);
  }

  let payload: ResetPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body JSON tidak valid." }, 400);
  }

  const adminId = payload.admin_id?.trim();
  const password = payload.password;

  if (!adminId || !password) {
    return json({ error: "admin_id dan password wajib diisi." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password minimal 8 karakter." }, 400);
  }

  // Resolve the auth user id from the admin_users row so the client can never
  // point this at an arbitrary account. The target must be an active admin.
  const { data: adminRow, error: adminLookupErr } = await admin
    .from("admin_users")
    .select("user_id, deleted_at")
    .eq("id", adminId)
    .maybeSingle();
  if (adminLookupErr) {
    return json({ error: `Gagal memuat admin: ${adminLookupErr.message}` }, 500);
  }
  if (!adminRow || adminRow.deleted_at) {
    return json({ error: "Admin tidak ditemukan." }, 404);
  }
  if (!adminRow.user_id) {
    return json({ error: "Admin ini belum tertaut ke akun login." }, 400);
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(
    adminRow.user_id,
    { password },
  );
  if (updateErr) {
    return json({ error: `Gagal mereset password: ${updateErr.message}` }, 400);
  }

  return json({ success: true });
});
