/**
 * Pure presentation helpers for a piece — no DB, no server-only imports — so
 * they can be shared by the collection loader, the Shopify adapter, and unit
 * tests alike. (Re-exported from `@/lib/collection` for existing callers.)
 */

/** Map a product's leaf category to a metallic render silhouette. */
const GLYPH_BY_CATEGORY: Record<string, string> = {
  kalash: "kalash", yantra: "yantra", pyramid: "pyramid",
  panel: "panel", chime: "chime", murtis: "vessel",
};
export function glyphForCategory(code: string): string {
  return GLYPH_BY_CATEGORY[code] ?? "vessel";
}

/** Pick the metallic gradient id from the primary metal's name. */
export function gradForMetal(metalName: string | null | undefined): string {
  const m = (metalName ?? "").toLowerCase();
  if (m.startsWith("silver")) return "gSilver";
  if (m.startsWith("brass")) return "gBrass";
  if (m.startsWith("copper")) return "gCopper";
  return "gAlloy";
}
