/**
 * supabase-js collapses ANY non-2xx from an Edge Function into a generic
 * "Edge Function returned a non-2xx status code" — the function's own message
 * is left unread in `error.context` (a Response). Dig it out so the UI can show
 * the real reason instead of a status code.
 */
export async function edgeFunctionError(error: unknown, data: unknown): Promise<Error> {
  let msg = (data as { error?: string } | null)?.error;
  const ctx = (error as { context?: Response }).context;
  if (!msg && ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.clone().json();
      msg = body?.error ?? body?.message;
    } catch {
      try {
        msg = await ctx.clone().text();
      } catch {
        /* body unreadable — fall through to the generic message */
      }
    }
  }
  return new Error(msg || (error as { message?: string })?.message || "Gagal memanggil fungsi.");
}
