import { computePanchang } from "./index";
import type { CityCode } from "./cities";

export type FestivalRule = {
  /** Purnimanta masa name (Iast). */
  masa: string;
  /** Tithi name (Iast). "Amāvāsyā" for new moon, "Pūrṇimā" for full moon. */
  tithi: string;
  /** Paksha. Ignored for Amāvāsyā/Pūrṇimā (implied). */
  paksha: "śukla" | "kṛṣṇa";
  /** When the tithi must prevail: "midday" (default) or "sunset" (pradoṣa, e.g. Deepāvalī). */
  basis?: "midday" | "sunset";
};

/**
 * Find the next date on or after `from` where the midday tithi at the given
 * city matches the rule. Scans forward day-by-day (bounded to 400 days —
 * a full lunar year is 354 days, so any real rule resolves within that).
 * Returns null if no match found in the window (indicates a bug in the rule).
 */
export function findFestivalDate(
  rule: FestivalRule,
  from: Date,
  city: CityCode = "delhi",
): Date | null {
  const start = new Date(from);
  start.setUTCHours(6, 0, 0, 0); // ~11:30 IST — safely after sunrise everywhere in India
  for (let d = 0; d < 400; d++) {
    const at = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
    // Festival days follow the tithi prevailing at local midday, not at sunrise.
    const p = computePanchang(city, at, { basis: rule.basis ?? "midday" });
    if (!p.ok || p.adhika) continue; // leap months carry no festivals
    if (p.masa.iast !== rule.masa) continue;
    if (p.tithi.iast !== rule.tithi) continue;
    // Amāvāsyā/Pūrṇimā are single-paksha by definition; skip paksha check
    if (rule.tithi !== "Amāvāsyā" && rule.tithi !== "Pūrṇimā" && p.tithi.paksha !== rule.paksha) continue;
    return at;
  }
  return null;
}
