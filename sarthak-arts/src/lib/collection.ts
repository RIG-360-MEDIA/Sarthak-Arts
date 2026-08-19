import { prisma } from "@/lib/db";
import { getAllDirections, type DirectionCard } from "@/lib/direction";
import { visualFor, DIRECTION_ANGLE } from "@/lib/direction-visual";
import { resolveDisplayCurrency, formatDisplay } from "@/lib/currency";

/**
 * Collection view model — everything the (storefront)/collection page needs,
 * shaped once here so the page and its components stay declarative.
 *
 * Filtering is URL-driven (the page passes parsed searchParams). Directions may
 * be multi-selected (comma-separated in the URL); category/metal/purpose are
 * single. The product set is small, so we fetch all live pieces once and filter
 * in-memory — this keeps counts, representative pieces, and the grid consistent
 * from a single source, and avoids duplicating the Prisma `where` shape.
 */

export type CollectionFilters = {
  directions: string[];      // e.g. ["north","east"] — empty = all
  category?: string;
  metal?: string;
  purpose?: string;
  sort: "newest" | "price-asc" | "price-desc";
};

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

export type PieceCard = {
  productId: number;
  slug: string;
  name: string;
  priceDisplay: string;
  priceMinor: number;
  createdAtMs: number;
  /** render props */
  glyph: string;
  metalGrad: string;
  gemHex: string;
  gemName: string | null;
  primaryMetalName: string | null;
  weightG: number | null;
  /** primary direction */
  directionCode: string;
  directionName: string;
  directionIast: string;
  directionDeity: string;
  directionDeva: string;
  directionGoverns: string;
  color: string;
  colorDeep: string;
  /** copy + state */
  positioningLine: string;
  placementNote: string;
  inStock: boolean;
  stockQuantity: number;
  isSample: boolean;
  categoryCode: string;
};

export type DirectionView = DirectionCard & {
  iast: string;
  deity: string;
  color: string;
  colorDeep: string;
  angle: number;          // screen-space bearing; center = null-ish (0)
  liveCount: number;      // live pieces that list this direction
  sample: { glyph: string; metalGrad: string; gemHex: string } | null;
};

export type CategoryView = { code: string; name: string; count: number };

export type CollectionView = {
  pieces: PieceCard[];
  totalLive: number;
  directions: DirectionView[];
  categories: CategoryView[];
  currency: { code: string; ratePerBase: number };
  filters: CollectionFilters;
};

type LiveProduct = Awaited<ReturnType<typeof loadLiveProducts>>[number];

function loadLiveProducts() {
  return prisma.product.findMany({
    where: { status: "live" },
    orderBy: { createdAt: "asc" },
    include: {
      category: true,
      composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" } },
      directions: { include: { direction: true } },
    },
  });
}

const BRAND_GEM = "#B8863E";

function toPiece(
  p: LiveProduct,
  currency: { code: string; ratePerBase: number },
): PieceCard {
  const primaryDir = p.directions[0]?.direction;
  const code = primaryDir?.code ?? "center";
  const v = visualFor(code);
  const metalLine = p.composition.find((c) => c.metal);
  const gemLine = p.composition.find((c) => c.gemstone);
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    priceDisplay: formatDisplay(p.basePriceMinor, currency.code, currency.ratePerBase),
    priceMinor: p.basePriceMinor,
    createdAtMs: p.createdAt.getTime(),
    glyph: glyphForCategory(p.category.code),
    metalGrad: gradForMetal(metalLine?.metal?.name),
    gemHex: gemLine?.gemstone?.accentHex ?? BRAND_GEM,
    gemName: gemLine?.gemstone?.name ?? null,
    primaryMetalName: metalLine?.metal?.name ?? null,
    weightG: metalLine?.weightGrams != null ? Number(metalLine.weightGrams) : null,
    directionCode: code,
    directionName: primaryDir?.name ?? "Center",
    directionIast: v.iast,
    directionDeity: v.deity,
    directionDeva: v.deva,
    directionGoverns: primaryDir?.governs ?? "",
    color: v.color,
    colorDeep: v.colorDeep,
    positioningLine: p.positioningLine,
    placementNote: p.placementNote,
    inStock: (p.stockQuantity ?? 0) > 0,
    stockQuantity: p.stockQuantity ?? 0,
    isSample: p.isSample,
    categoryCode: p.category.code,
  };
}

const EMPTY_CURRENCY = { code: "INR", ratePerBase: 1 };

export async function getCollectionView(filters: CollectionFilters): Promise<CollectionView> {
  // Fail soft when the DB is unreachable (e.g. Neon asleep) — the page still
  // renders its hero and an honest empty state rather than a 500.
  let products: LiveProduct[], dirCards: Awaited<ReturnType<typeof getAllDirections>>,
      currency: { code: string; ratePerBase: number };
  try {
    [products, dirCards, currency] = await Promise.all([
      loadLiveProducts(),
      getAllDirections(),
      resolveDisplayCurrency(),
    ]);
  } catch (err) {
    console.warn("[collection] load failed, rendering empty:", err instanceof Error ? err.message : err);
    return { pieces: [], totalLive: 0, directions: [], categories: [], currency: EMPTY_CURRENCY, filters };
  }

  const allPieces = products.map((p) => toPiece(p, currency));

  // Per-direction live counts + a representative piece (real preferred over sample).
  const codesByProduct = new Map(products.map((p) => [p.id, p.directions.map((d) => d.direction.code)]));
  const directions: DirectionView[] = dirCards.map((dc) => {
    const v = visualFor(dc.code);
    const inZone = allPieces.filter((pc) => codesByProduct.get(pc.productId)?.includes(dc.code));
    const rep = inZone.find((pc) => !pc.isSample) ?? inZone[0] ?? null;
    return {
      ...dc,
      iast: v.iast,
      deity: v.deity,
      color: v.color,
      colorDeep: v.colorDeep,
      angle: DIRECTION_ANGLE[dc.code] ?? 0,
      liveCount: inZone.length,
      sample: rep ? { glyph: rep.glyph, metalGrad: rep.metalGrad, gemHex: rep.gemHex } : null,
    };
  });

  // Category chips (leaf categories that actually have live pieces).
  const catMap = new Map<string, CategoryView>();
  for (const p of products) {
    const c = p.category;
    const cur = catMap.get(c.code) ?? { code: c.code, name: c.name, count: 0 };
    cur.count += 1;
    catMap.set(c.code, cur);
  }
  const categories = [...catMap.values()].sort((a, b) => b.count - a.count);

  // Apply filters in-memory.
  let pieces = allPieces;
  if (filters.directions.length)
    pieces = pieces.filter((pc) => {
      const codes = codesByProduct.get(pc.productId) ?? [];
      return filters.directions.some((d) => codes.includes(d));
    });
  if (filters.category)
    pieces = pieces.filter((pc) => pc.categoryCode === filters.category);
  if (filters.metal)
    pieces = pieces.filter((pc) => (pc.primaryMetalName ?? "").toLowerCase() === filters.metal!.toLowerCase());

  if (filters.sort === "price-asc") pieces = [...pieces].sort((a, b) => a.priceMinor - b.priceMinor);
  else if (filters.sort === "price-desc") pieces = [...pieces].sort((a, b) => b.priceMinor - a.priceMinor);
  else pieces = [...pieces].sort((a, b) => b.createdAtMs - a.createdAtMs); // newest

  return {
    pieces,
    totalLive: allPieces.length,
    directions,
    categories,
    currency,
    filters,
  };
}

// URL helpers live in a client-safe module; re-exported here for server callers.
export { toQuery, toggleDirection } from "@/lib/collection-url";

/** Parse raw searchParams into typed CollectionFilters. */
export function parseFilters(sp: Record<string, string | undefined>): CollectionFilters {
  const directions = (sp.direction ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sort: CollectionFilters["sort"] =
    sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "newest";
  return { directions, category: sp.category, metal: sp.metal, purpose: sp.purpose, sort };
}
