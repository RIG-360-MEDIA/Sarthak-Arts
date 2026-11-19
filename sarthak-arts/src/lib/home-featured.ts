import { prisma } from "@/lib/db";
import { realPhoto } from "@/lib/collection";

export type FeaturedPiece = {
  slug: string;
  name: string;
  positioningLine: string;
  priceMinor: number;
  isSample: boolean;
  categoryCode: string;
  deityName: string | null;
  stockQuantity: number;
  primaryMetalName: string | null;
  primaryMetalWeightG: number | null;
  primaryMetalLabel: string | null;
  photoUrl: string | null;
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
  // Fail-soft against a suspended Neon endpoint — the homepage is a
  // marketing surface and hard-crashing on an idle DB is worse than
  // rendering the rest of the page with no featured pieces. When the
  // DB is up, the pieces come back automatically. Real breakages
  // during a live session still show in dev logs via console.warn.
  let rows;
  try {
    rows = await prisma.product.findMany({
      where: { status: "live" },
      orderBy: [{ isSample: "asc" }, { createdAt: "desc" }],
      take: count,
      include: {
        category: true,
        deity: true,
        composition: { include: { metal: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });
  } catch (err) {
    console.warn("[home-featured] getFeaturedPieces failed, rendering empty:", err instanceof Error ? err.message : err);
    return [];
  }
  return rows.map((p) => {
    const comp = p.composition[0] ?? null;
    return {
      slug: p.slug,
      name: p.name,
      positioningLine: p.positioningLine,
      priceMinor: p.basePriceMinor,
      isSample: p.isSample,
      stockQuantity: p.stockQuantity,
      categoryCode: p.category.code,
      deityName: p.deity?.name ?? null,
      primaryMetalName: comp?.metal?.name ?? null,
      primaryMetalWeightG: comp?.weightGrams != null ? Number(comp.weightGrams) : null,
      primaryMetalLabel: comp?.label ?? null,
      photoUrl: realPhoto(p.images[0]?.url),
    };
  });
}

const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export function formatINR(minor: number): string {
  return `₹${inrFmt.format(Math.round(minor / 100))}`;
}
