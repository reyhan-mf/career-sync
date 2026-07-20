import type { PostgrestError } from "@supabase/supabase-js";

/**
 * PostgREST caps every response at `max-rows` (1000 on Supabase by default)
 * and truncates SILENTLY — no error, no flag. A query whose result set can
 * legitimately exceed that must page through with `.range()`, or it will
 * quietly return partial data.
 */
export const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: PostgrestError | null };

/**
 * Runs `page(from, to)` repeatedly until a short page comes back, and returns
 * every row. The query MUST carry a deterministic `.order(...)`: range paging
 * without a total order can skip or duplicate rows between requests.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}
