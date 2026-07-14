import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/home-featured";

export type FestivalPick = {
  slug: string;
  name: string;
  positioningLine: string;
  priceMinorFmt: string;
};

export type NextFestival = {
  code: string;
  name: string;
  nameDeva: string;
  nameIast: string;
  tagline: string;
  observedOn: Date;
  daysAway: number;
  dateLabel: string;      // e.g. "28 August"
  masaIast: string | null;
  tithiIast: string | null;
  paksha: string | null;
  picks: FestivalPick[];
  source: string;
};

/**
 * Return the very next festival (from a chosen region) whose observedOn is
 * still in the future. Returns null if none — the seeded window has run out
 * and yearly re-seed is due (fail-loud rather than showing a stale festival).
 */
export async function getNextFestival(region = "north"): Promise<NextFestival | null> {
  const now = new Date();
  const f = await prisma.festival.findFirst({
    where: { observedOn: { gte: now }, regions: { has: region } },
    orderBy: { observedOn: "asc" },
  });
  if (!f) return null;

  // Look up product picks in one query, in whatever order they were listed.
  const pieces = f.productSlugs.length > 0
    ? await prisma.product.findMany({
        where: { slug: { in: f.productSlugs }, status: "live" },
      })
    : [];
  const bySlug = new Map(pieces.map((p) => [p.slug, p]));
  const picks: FestivalPick[] = f.productSlugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      positioningLine: p.positioningLine,
      priceMinorFmt: formatINR(p.basePriceMinor),
    }));

  // days-away in India time — festival day vs today's date, not raw hours.
  const dayMs = 24 * 60 * 60 * 1000;
  const todayIST = Math.floor((now.getTime() + 330 * 60 * 1000) / dayMs);
  const festIST = Math.floor((f.observedOn.getTime() + 330 * 60 * 1000) / dayMs);
  const daysAway = Math.max(0, festIST - todayIST);

  const dateLabel = f.observedOn.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", timeZone: "Asia/Kolkata",
  });

  return {
    code: f.code, name: f.name, nameDeva: f.nameDeva, nameIast: f.nameIast,
    tagline: f.tagline, observedOn: f.observedOn, daysAway, dateLabel,
    masaIast: f.masaIast, tithiIast: f.tithiIast, paksha: f.paksha,
    picks, source: f.source,
  };
}
