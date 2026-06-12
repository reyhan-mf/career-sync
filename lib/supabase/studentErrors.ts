// Error formatter for mahasiswa (student) pages. Mirrors adminErrors.ts but
// emits MHS[XX] codes so support can tell at a glance which surface the
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

export function formatStudentError(err: unknown): FriendlyError {
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
      code: "MHS[01]",
      message: "Koneksi internet terganggu. Periksa jaringan Anda lalu coba lagi.",
      raw: err,
    };
  }

  if (
    e.status === 401 ||
    /jwt expired|invalid token|no session|not authenticated|missing.*authorization/i.test(msg)
  ) {
    return {
      code: "MHS[02]",
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
      code: "MHS[03]",
      message: "Anda tidak memiliki izin untuk melihat data ini.",
      raw: err,
    };
  }

  if (e.code === "PGRST116" || /not found|tidak ditemukan/i.test(msg)) {
    return {
      code: "MHS[04]",
      message: "Data yang dicari tidak ditemukan.",
      raw: err,
    };
  }

  // Profile incomplete — student row not linked yet (admin hasn't provisioned).
  if (/belum.*ditautkan|profile.*not.*set|no student row|akun.*belum/i.test(msg)) {
    return {
      code: "MHS[05]",
      message:
        "Akun Anda belum ditautkan ke data mahasiswa. Hubungi admin prodi untuk aktivasi.",
      raw: err,
    };
  }

  if ((e.status ?? 0) >= 500 || /internal server|server error/i.test(msg)) {
    return {
      code: "MHS[07]",
      message: "Server bermasalah saat ini. Coba lagi beberapa saat lagi.",
      raw: err,
    };
  }

  return {
    code: "MHS[99]",
    message: "Terjadi kesalahan tak terduga. Cek konsol untuk detail teknis.",
    raw: err,
  };
}

export function reportStudentError(err: unknown, context: string): string {
  const f = formatStudentError(err);
  if (typeof window !== "undefined") {
    console.error(`[${f.code}] ${context}:`, f.raw);
  }
  return `${f.message} (Kode Error: ${f.code})`;
}
