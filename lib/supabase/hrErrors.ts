// Error formatter for HR (recruiter) pages. Mirrors studentErrors.ts but
// emits HR[XX] codes so support can tell at a glance which surface the
// report came from.

export interface FriendlyError {
  code: string;
  message: string;
  raw: unknown;
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
  name?: string;
}

function asErrorLike(err: unknown): ErrorLike {
  if (err && typeof err === "object") return err as ErrorLike;
  return { message: String(err) };
}

export function formatHrError(err: unknown): FriendlyError {
  const e = asErrorLike(err);
  const msg = e.message ?? "";

  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (
    isOffline ||
    /failed to fetch|networkerror|load failed|network ?error|err_internet_disconnected|err_network_changed|fetch ?error|aborterror/i.test(
      msg,
    )
  ) {
    return {
      code: "HR[01]",
      message: "Koneksi internet terganggu. Periksa jaringan Anda lalu coba lagi.",
      raw: err,
    };
  }

  if (
    e.status === 401 ||
    /jwt expired|invalid token|no session|not authenticated|missing.*authorization/i.test(msg)
  ) {
    return {
      code: "HR[02]",
      message: "Sesi login Anda telah berakhir. Silakan login ulang.",
      raw: err,
    };
  }

  if (
    e.status === 403 ||
    e.code === "42501" ||
    e.code === "PGRST301" ||
    /row.?level security|permission denied|policy/i.test(msg)
  ) {
    return {
      code: "HR[03]",
      message: "Anda tidak memiliki izin untuk melakukan aksi ini.",
      raw: err,
    };
  }

  if (e.code === "PGRST116" || /not found|tidak ditemukan/i.test(msg)) {
    return {
      code: "HR[04]",
      message: "Data yang dicari tidak ditemukan.",
      raw: err,
    };
  }

  if (
    /akun.*hr.*belum|hr.*profile.*not.*set|no hr row|belum ditautkan|hr_profile_missing|company_missing/i.test(
      msg,
    )
  ) {
    return {
      code: "HR[05]",
      message:
        "Profil HR tidak terbaca. Biasanya karena policy RLS belum dipasang — buka Supabase Dashboard → SQL Editor, jalankan supabase/migrations/20260519_hr_rls_policies.sql, lalu refresh halaman ini.",
      raw: err,
    };
  }

  // 23503 = foreign_key_violation: the row is still referenced elsewhere. Without
  // this, a delete blocked by a child row fell through to the useless HR[99].
  if (e.code === "23503" || /foreign key constraint|violates foreign key/i.test(msg)) {
    return {
      code: "HR[08]",
      message:
        "Data ini masih dipakai oleh data lain (misalnya lamaran atau undangan), " +
        "jadi belum bisa dihapus. Hapus/tutup data terkait terlebih dahulu.",
      raw: err,
    };
  }

  if ((e.status ?? 0) >= 500 || /internal server|server error/i.test(msg)) {
    return {
      code: "HR[07]",
      message: "Server bermasalah saat ini. Coba lagi beberapa saat lagi.",
      raw: err,
    };
  }

  return {
    code: "HR[99]",
    message: "Terjadi kesalahan tak terduga. Cek konsol untuk detail teknis.",
    raw: err,
  };
}

export function reportHrError(err: unknown, context: string): string {
  const f = formatHrError(err);
  if (typeof window !== "undefined") {
    console.error(`[${f.code}] ${context}:`, f.raw);
  }
  return `${f.message} (Kode Error: ${f.code})`;
}
