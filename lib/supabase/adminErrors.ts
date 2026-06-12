// Centralized error formatter for admin-page operations.
//
// Goal: turn arbitrary errors (network failures, Postgres errors, edge
// function responses, etc.) into a short user-friendly message paired with a
// stable error code the user can quote back. The original technical detail
// is logged to console for developers; the UI only shows the friendly text.
//
// Code scheme (ADM[XX]):
//   01 Connection error      — network down, DNS, CORS, etc.
//   02 Session expired       — JWT invalid / no session
//   03 Permission denied     — RLS / role-mismatch
//   04 Duplicate data        — unique violation, already exists
//   05 Reference in use      — FK violation (cannot delete because referenced)
//   06 Not found             — row missing
//   07 Server error          — 5xx / unexpected backend failure
//   08 Setup required        — missing migration / function / edge function
//   09 Validation            — invalid input rejected by backend
//   10 Auth conflict         — email already registered in auth.users
//   99 Unknown               — anything that didn't match above

export interface FriendlyError {
  code: string;
  message: string;
  /** Underlying value as-thrown — for console logging only, never shown. */
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

export function formatAdminError(err: unknown): FriendlyError {
  const e = asErrorLike(err);
  const msg = e.message ?? "";

  // 1. Network — supabase-js sometimes wraps the underlying fetch TypeError
  // in a plain Error, so we cannot rely on `instanceof TypeError`. Detect by
  // message alone, plus the offline-flag fallback.
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (
    isOffline ||
    /failed to fetch|networkerror|load failed|network ?error|err_internet_disconnected|err_network_changed|fetch ?error|aborterror/i.test(
      msg,
    )
  ) {
    return {
      code: "ADM[01]",
      message: "Koneksi internet terganggu. Periksa jaringan Anda lalu coba lagi.",
      raw: err,
    };
  }

  // 2. Session
  if (
    e.status === 401 ||
    /jwt expired|invalid token|no session|not authenticated|missing.*authorization/i.test(msg)
  ) {
    return {
      code: "ADM[02]",
      message: "Sesi login Anda telah berakhir. Silakan login ulang.",
      raw: err,
    };
  }

  // 3. Permission / RLS
  if (
    e.status === 403 ||
    e.code === "42501" ||
    e.code === "PGRST301" ||
    /row.?level security|permission denied|policy/i.test(msg)
  ) {
    return {
      code: "ADM[03]",
      message: "Anda tidak memiliki izin untuk melakukan operasi ini.",
      raw: err,
    };
  }

  // 10. Auth-side duplicate email (Supabase Auth admin API)
  if (/already.*registered|user.*exists|email.*exists/i.test(msg)) {
    return {
      code: "ADM[10]",
      message: "Email tersebut sudah terdaftar sebagai pengguna. Gunakan email lain.",
      raw: err,
    };
  }

  // 4. Duplicate (unique constraint)
  if (e.code === "23505" || /duplicate key|unique constraint/i.test(msg)) {
    return {
      code: "ADM[04]",
      message: "Data dengan kunci yang sama sudah ada di sistem.",
      raw: err,
    };
  }

  // 5. Foreign key violation (referenced by something else)
  if (e.code === "23503" || /foreign key|violates.*reference/i.test(msg)) {
    return {
      code: "ADM[05]",
      message:
        "Data tidak dapat dihapus karena masih dipakai oleh entri lain. " +
        "Hapus data terkait terlebih dahulu.",
      raw: err,
    };
  }

  // 6. Not found
  if (e.code === "PGRST116" || /not found|tidak ditemukan/i.test(msg)) {
    return {
      code: "ADM[06]",
      message: "Data yang dicari tidak ditemukan.",
      raw: err,
    };
  }

  // 9. Check constraint / not null / validation
  if (e.code === "23502" || e.code === "23514" || /violates.*not.?null|check constraint/i.test(msg)) {
    return {
      code: "ADM[09]",
      message: "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
      raw: err,
    };
  }

  // 8. Setup required — function missing, migration not run
  if (
    e.code === "PGRST202" ||
    /admin_delete_student|undefined function|function .* does not exist/i.test(msg) ||
    /edge function/i.test(msg)
  ) {
    return {
      code: "ADM[08]",
      message:
        "Konfigurasi backend belum lengkap. Hubungi admin sistem untuk menjalankan setup database.",
      raw: err,
    };
  }

  // 7. Generic server error
  if ((e.status ?? 0) >= 500 || /internal server|server error/i.test(msg)) {
    return {
      code: "ADM[07]",
      message: "Server bermasalah saat ini. Coba lagi beberapa saat lagi.",
      raw: err,
    };
  }

  // 99. Fallthrough — do NOT leak the raw technical message to the UI.
  // The full detail is logged to console (see reportAdminError) so a dev
  // can inspect; the user only sees a generic line + the code to quote.
  return {
    code: "ADM[99]",
    message: "Terjadi kesalahan tak terduga. Cek konsol untuk detail teknis.",
    raw: err,
  };
}

/**
 * Format an error for display AND log the underlying detail to console.
 * Use in catch blocks: `setError(reportAdminError(e, "createMatkul"))`.
 */
export function reportAdminError(err: unknown, context: string): string {
  const f = formatAdminError(err);
  if (typeof window !== "undefined") {
    console.error(`[${f.code}] ${context}:`, f.raw);
  }
  // Format keeps the friendly explanation first, then a clearly labelled
  // "Kode Error" the user can quote back to the developer when reporting.
  return `${f.message} (Kode Error: ${f.code})`;
}
