import { prisma } from "@/lib/db";

export function parseSetting<T>(row: { key: string; value: unknown } | null, fallback: T): T {
  if (!row || row.value === null || row.value === undefined) return fallback;
  return row.value as T;
}

/**
 * Read a settings row, returning `fallback` when the row is missing OR
 * when the database is unreachable. The fallback contract is the same
 * either way — the caller has committed to a sensible default — so
 * degrading gracefully on a suspended Neon endpoint matches the intent
 * of the API.
 *
 * Errors are logged (so a real breakage during a live session is still
 * visible in dev logs) but never re-thrown; the caller gets its
 * fallback and the page renders.
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return parseSetting(row, fallback);
  } catch (err) {
    console.warn(`[settings] getSetting(${key}) failed, using fallback:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}
