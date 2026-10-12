import { prisma } from "@/lib/db";
import { findFestivalDate } from "@/lib/panchang/festivals";
import { FESTIVALS, type FestivalDef } from "@/lib/festival-list";

const DAY_MS = 86_400_000;
const ALL_REGIONS = ["north", "south", "bengali", "gaudiya"];

/** Start of today in India, as a UTC instant. */
function startOfTodayIST(now = new Date()): Date {
  return new Date(Math.floor((now.getTime() + 330 * 60_000) / DAY_MS) * DAY_MS - 330 * 60_000);
}

/** Next date (today or later, India time) a festival falls on. */
export function nextFestivalDate(f: FestivalDef, from = new Date()): Date | null {
  const today = startOfTodayIST(from);
  if (f.fixedDate) {
    const [m, d] = f.fixedDate.split("-").map(Number);
    const year = new Date(today.getTime() + 330 * 60_000).getUTCFullYear();
    for (const y of [year, year + 1]) {
      const at = new Date(Date.UTC(y, m - 1, d, 6, 30)); // noon IST
      if (at >= today) return at;
    }
    return null;
  }
  return f.rule ? findFestivalDate(f.rule, today, "delhi") : null;
}

/**
 * Keep the Festival table in step with the master list, with no one touching it:
 * every festival gets one row dated to its next occurrence; passed ones roll to
 * next year; anything no longer in the list is removed. Runs nightly (Vercel cron).
 */
export async function syncFestivals(): Promise<{ updated: number; removed: number }> {
  const today = startOfTodayIST();
  const rows = await prisma.festival.findMany();
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const wanted = new Set(FESTIVALS.map((f) => f.code));
  let updated = 0;

  for (const f of FESTIVALS) {
    const row = byCode.get(f.code);
    // Only recompute when needed — the lunar search is the expensive part.
    const observedOn = row && row.observedOn >= today ? row.observedOn : nextFestivalDate(f);
    if (!observedOn) continue;
    const data = {
      name: f.name, nameDeva: f.nameDeva, nameIast: f.nameIast, tagline: f.tagline, observedOn,
      masaIast: f.rule?.masa ?? null, tithiIast: f.rule?.tithi ?? null, paksha: f.rule?.paksha ?? null,
      basis: f.rule?.basis ?? null, fixedDate: f.fixedDate ?? null,
      regions: f.regions ?? ALL_REGIONS, productSlugs: f.productSlugs ?? [],
      source: "Computed from the tithi rule by the site's panchang engine",
    };
    await prisma.festival.upsert({ where: { code: f.code }, update: data, create: { code: f.code, ...data } });
    updated++;
  }

  const { count: removed } = await prisma.festival.deleteMany({ where: { code: { notIn: [...wanted] } } });
  return { updated, removed };
}
