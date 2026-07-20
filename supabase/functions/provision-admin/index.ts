import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProvisionPayload {
  email?: string;
  password?: string;
  name?: string;
  prodi_id?: string;
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

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) {
    return json({ error: "Sesi tidak valid." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRole);

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
    return json({ error: "Hanya superadmin yang boleh menambah admin prodi." }, 403);
  }

  let payload: ProvisionPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body JSON tidak valid." }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const name = payload.name?.trim();
  const prodiId = payload.prodi_id?.trim();

  if (!email || !password || !name || !prodiId) {
    return json({ error: "Email, password, nama, dan prodi wajib diisi." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password minimal 8 karakter." }, 400);
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  let userId: string;
  // Set when we are reactivating a soft-deleted admin_users row rather than
  // inserting a new one.
  let reviveRowId: string | null = null;

  if (createErr || !created?.user) {
    // Deleting an admin only soft-deletes the row (deleted_at); the auth user
    // survives. So re-adding a previously deleted admin always lands here with
    // "email already registered". Reactivate that admin instead of failing —
    // but only if the email really does belong to a soft-deleted admin. Any
    // other account with this email (student, HR, superadmin) must never be
    // taken over.
    const { data: priorRows, error: priorErr } = await admin
      .from("admin_users")
      .select("id, user_id, deleted_at")
      .eq("email", email)
      .not("user_id", "is", null);
    if (priorErr) {
      return json({ error: `Gagal memeriksa admin lama: ${priorErr.message}` }, 500);
    }

    if (priorRows?.some((r) => r.deleted_at === null)) {
      return json({ error: `Email ${email} sudah dipakai admin prodi yang aktif.` }, 409);
    }

    const prior = (priorRows ?? [])
      .slice()
      .sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)))[0];
    if (!prior) {
      return json({
        error:
          `Email ${email} sudah terdaftar untuk akun lain (mahasiswa/HR/superadmin). ` +
          "Gunakan email lain.",
      }, 409);
    }

    userId = prior.user_id as string;
    reviveRowId = prior.id;

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (updErr) {
      return json({ error: `Gagal mengaktifkan ulang akun: ${updErr.message}` }, 400);
    }
  } else {
    userId = created.user.id;
  }

  // Only tear down the auth user if THIS request created it. A revived admin's
  // auth user predates us — deleting it would destroy an account we were only
  // borrowing.
  const rollback = async () => {
    if (reviveRowId) return;
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  // The role row survives a soft delete too, so insert would hit the
  // (user_id, role) primary key on revive.
  const { error: roleErr } = await admin.from("user_roles").upsert(
    { user_id: userId, role: "admin", scope_id: prodiId },
    { onConflict: "user_id,role" },
  );
  if (roleErr) {
    await rollback();
    return json({ error: `Gagal menyimpan role: ${roleErr.message}` }, 500);
  }

  const { data: adminRow, error: adminErr } = reviveRowId
    ? await admin
      .from("admin_users")
      .update({ name, email, prodi_id: prodiId, deleted_at: null })
      .eq("id", reviveRowId)
      .select(`*, prodi ( name, integration_status )`)
      .single()
    : await admin
      .from("admin_users")
      .insert({ user_id: userId, name, email, prodi_id: prodiId })
      .select(`*, prodi ( name, integration_status )`)
      .single();

  if (adminErr || !adminRow) {
    if (!reviveRowId) {
      await admin.from("user_roles").delete().eq("user_id", userId);
      await rollback();
    }
    return json({ error: `Gagal menyimpan admin: ${adminErr?.message}` }, 500);
  }

  return json({ admin: adminRow });
});
