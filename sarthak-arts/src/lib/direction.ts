import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/home-featured";

/**
 * The 8 cardinal directions in the traditional pradakṣiṇa order (clockwise from
 * North), followed by the Center. Used everywhere the direction wheel appears
 * and for adjacency computation on individual pages.
 */
export const CLOCKWISE_ORDER = [
  "north", "northeast", "east", "southeast",
  "south", "southwest", "west", "northwest",
] as const;

export type DirectionCode = (typeof CLOCKWISE_ORDER)[number] | "center";

/** A card-sized summary — used on the index grid and for adjacent-direction chips. */
export type DirectionCard = {
  code: string;
  name: string;                   // "Northeast"
  sanskritName: string;           // "Īśāna"
  deva: string;                   // "ईशान"
  element: string | null;
  governs: string;
  microcopy: string;
  productCount: number;
  realProductCount: number;
};

/** Full page data — includes the products and the adjacent directions. */
export type DirectionPage = DirectionCard & {
  products: Array<{
    slug: string;
    name: string;
    positioningLine: string;
    priceMinorFmt: string;
    isSample: boolean;
    deityName: string | null;
    primaryMetalName: string | null;
    primaryMetalWeightG: number | null;
    categoryCode: string;
  }>;
  prev: DirectionCard | null;
  next: DirectionCard | null;
};

/** Canonical Devanagari for each direction (verified vs Monier-Williams). */
const DEVA_BY_CODE: Record<string, string> = {
  north:     "कुबेर",       // Kubera
  northeast: "ईशान",       // Īśāna
  east:      "इन्द्र",       // Indra
  southeast: "अग्नि",       // Agni
  south:     "यम",         // Yama
  southwest: "निर्ऋति",     // Nirṛti
  west:      "वरुण",        // Varuṇa
  northwest: "वायु",        // Vāyu
  center:    "ब्रह्म",       // Brahmā (the Brahmasthan)
};

function toCard(d: Awaited<ReturnType<typeof loadDirectionsRaw>>[number]): DirectionCard {
  const products = d.products;
  return {
    code: d.code,
    name: d.name,
    sanskritName: d.sanskritName,
    deva: DEVA_BY_CODE[d.code] ?? "",
    element: d.element,
    governs: d.governs,
    microcopy: d.microcopy,
    productCount: products.length,
    realProductCount: products.filter((pd) => !pd.product.isSample).length,
  };
}

async function loadDirectionsRaw() {
  return prisma.direction.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    include: {
      products: {
        include: { product: true },
      },
    },
  });
}

/** All 9 directions for the index page. */
export async function getAllDirections(): Promise<DirectionCard[]> {
  const rows = await loadDirectionsRaw();
  return rows.map(toCard);
}

/** One direction's full page: education, products, and adjacent directions. */
export async function getDirectionPage(code: string): Promise<DirectionPage | null> {
  const all = await loadDirectionsRaw();
  const target = all.find((d) => d.code === code);
  if (!target) return null;

  const products = await prisma.product.findMany({
    where: {
      status: "live",
      directions: { some: { directionId: target.id } },
    },
    orderBy: [{ isSample: "asc" }, { basePriceMinor: "asc" }],
    include: {
      category: true,
      deity: true,
      composition: { include: { metal: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const cards: Record<string, DirectionCard> = {};
  for (const d of all) cards[d.code] = toCard(d);

  // Adjacent = previous & next in the clockwise ring; center has no adjacency.
  let prev: DirectionCard | null = null;
  let next: DirectionCard | null = null;
  if (code !== "center") {
    const i = CLOCKWISE_ORDER.indexOf(code as (typeof CLOCKWISE_ORDER)[number]);
    if (i >= 0) {
      prev = cards[CLOCKWISE_ORDER[(i - 1 + CLOCKWISE_ORDER.length) % CLOCKWISE_ORDER.length]] ?? null;
      next = cards[CLOCKWISE_ORDER[(i + 1) % CLOCKWISE_ORDER.length]] ?? null;
    }
  }

  return {
    ...toCard(target),
    products: products.map((p) => {
      const comp = p.composition[0] ?? null;
      return {
        slug: p.slug,
        name: p.name,
        positioningLine: p.positioningLine,
        priceMinorFmt: formatINR(p.basePriceMinor),
        isSample: p.isSample,
        deityName: p.deity?.name ?? null,
        primaryMetalName: comp?.metal?.name ?? null,
        primaryMetalWeightG: comp?.weightGrams != null ? Number(comp.weightGrams) : null,
        categoryCode: p.category.code,
      };
    }),
    prev,
    next,
  };
}
