/**
 * Pure, client-safe URL helpers for the collection filters. Kept separate from
 * `collection.ts` (which imports Prisma / next/headers) so Client Components can
 * import these without pulling server-only code into the browser bundle.
 */

/** Build a /collection href from a flat params bag (empty values dropped). */
export function toQuery(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  const s = u.toString();
  return s ? `/collection?${s}` : "/collection";
}

/** Toggle a direction code within a multi-select list. */
export function toggleDirection(current: string[], code: string): string[] {
  return current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
}
