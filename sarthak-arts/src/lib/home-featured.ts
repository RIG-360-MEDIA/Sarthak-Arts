import { prisma } from "@/lib/db";

export type FeaturedPiece = {
  slug: string;
  name: string;
  positioningLine: string;
  priceMinor: number;
  isSample: boolean;
  categoryCode: string;
  deityName: string | null;
  directionCode: string | null;
  directionName: string | null;
  directionElement: string | null;
  // First metal listed by sortOrder; used for the "material · weight · maker" line.
  primaryMetalName: string | null;
  primaryMetalWeightG: number | null;
  primaryMetalLabel: string | null;
};

/**
 * Load N featured pieces for the homepage. Real products (isSample=false) are
 * preferred; samples fill remaining slots. Every value returned is real Prisma
 * data — no hardcoding on the page.
 *
 * Deliberately does not read reviews / ratings — those come online when we
 * have real customer reviews (see the hidden Bhaktas section for the same
 * "no fake social proof" rule).
 */
export async function getFeaturedPieces(count = 3): Promise<FeaturedPiece[]> {
  const rows = await prisma.product.findMany({
    where: { status: "live" },
    orderBy: [{ isSample: "asc" }, { createdAt: "desc" }],
    take: count,
    include: {
      category: true,
      deity: true,
      // ProductDirection has a composite key (no `id`); pick the first-linked one deterministically.
      directions: { include: { direction: true }, orderBy: { directionId: "asc" }, take: 1 },
      composition: { include: { metal: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  return rows.map((p) => {
    const dir = p.directions[0]?.direction ?? null;
    const comp = p.composition[0] ?? null;
    return {
      slug: p.slug,
      name: p.name,
      positioningLine: p.positioningLine,
      priceMinor: p.basePriceMinor,
      isSample: p.isSample,
      categoryCode: p.category.code,
      deityName: p.deity?.name ?? null,
      directionCode: dir?.code ?? null,
      directionName: dir?.name ?? null,
      directionElement: dir?.element ?? null,
      primaryMetalName: comp?.metal?.name ?? null,
      // weightGrams is Prisma Decimal — normalize to plain number for the client boundary.
      primaryMetalWeightG: comp?.weightGrams != null ? Number(comp.weightGrams) : null,
      primaryMetalLabel: comp?.label ?? null,
    };
  });
}

const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export function formatINR(minor: number): string {
  return `₹${inrFmt.format(Math.round(minor / 100))}`;
}
