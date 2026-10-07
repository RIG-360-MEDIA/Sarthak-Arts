import { prisma } from "@/lib/db";
import type { DirectionCard } from "@/lib/direction";
import { visualFor, DIRECTION_ANGLE } from "@/lib/direction-visual";
import { resolveDisplayCurrency, formatDisplay } from "@/lib/currency";
import { isShopifyEnabled } from "@/lib/shopify/config";

/**
 * Collection view model — everything the (storefront)/collection page needs.
 *
 * Built to scale to a large catalogue across nine directions:
 *   • Counts (per-direction, per-category, total) come from cheap COUNT/groupBy
 *     queries — never by loading every product.
 *   • The page has TWO modes:
 *       - "overview" (no filters): each direction shows a capped preview
 *         (OVERVIEW_PER_DIR) plus "explore all N", so the landing view stays
 *         fast and scannable no matter how big the catalogue grows.
 *       - "grid" (any filter active): a single database-paginated grid using
 *         skip/take, so page weight is constant regardless of total products.
 * Filtering is URL-driven (the page passes parsed searchParams).
 */

export const OVERVIEW_PER_DIR = 6;   // preview cards per direction on the landing view
export const PAGE_SIZE = 24;          // grid page size; "show more" grows in these steps

export type CollectionFilters = {
  directions: string[];      // e.g. ["north","east"] — empty = all
  category?: string;
  metal?: string;
  purpose?: string;
  sort: "newest" | "price-asc" | "price-desc";
  show: number;              // how many to render in grid mode (paginated)
};

// Pure piece-visual helpers now live in a server-free module; re-exported here
// so existing callers (and the Shopify adapter, and tests) share one source.
export { glyphForCategory, gradForMetal } from "@/lib/piece-visual";
import { glyphForCategory, gradForMetal } from "@/lib/piece-visual";

export type PieceCard = {
  productId: number;
  /** Shopify variant id — present only in headless Shopify mode; used for cart. */
  variantId?: string;
  slug: string;
  name: string;
  priceDisplay: string;
  priceMinor: number;
  createdAtMs: number;
  glyph: string;
  metalGrad: string;
  gemHex: string;
  gemName: string | null;
  primaryMetalName: string | null;
  weightG: number | null;
  directionCode: string;
  directionName: string;
  directionIast: string;
  directionDeity: string;
  directionDeva: string;
  directionGoverns: string;
  color: string;
  colorDeep: string;
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
  angle: number;          // screen-space bearing
  liveCount: number;      // live pieces that list this direction
};

export type CategoryView = { code: string; name: string; count: number };

export type OverviewGroup = { direction: DirectionView; items: PieceCard[]; hasMore: boolean };

export type CollectionView = {
  mode: "overview" | "grid";
  /** overview mode: capped preview per direction */
  overview: OverviewGroup[];
  /** overview mode: live pieces not yet assigned a direction */
  unplaced: PieceCard[];
  /** grid mode: the current (paginated) page of matching pieces */
  pieces: PieceCard[];
  matchCount: number;     // grid mode: total matching the filters
  shown: number;          // grid mode: how many are rendered now
  hasMore: boolean;       // grid mode: are there more to load?
  totalLive: number;
  directions: DirectionView[];
  categories: CategoryView[];
  currency: { code: string; ratePerBase: number };
  filters: CollectionFilters;
};

const PIECE_INCLUDE = {
  category: true,
  composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" as const } },
  directions: { include: { direction: true } },
} as const;

type LiveProduct = Awaited<ReturnType<typeof loadOne>>;
async function loadOne() {
  return prisma.product.findFirst({ where: { status: "live" }, include: PIECE_INCLUDE });
}

const BRAND_GEM = "#B8863E";

function toPiece(
  p: NonNullable<LiveProduct>,
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

function emptyView(filters: CollectionFilters): CollectionView {
  return {
    mode: "overview", overview: [], unplaced: [], pieces: [], matchCount: 0, shown: 0, hasMore: false,
    totalLive: 0, directions: [], categories: [], currency: EMPTY_CURRENCY, filters,
  };
}

/** Prisma `where` for the active filters (excluding status, added by callers). */
function filterWhere(filters: CollectionFilters) {
  const and: Record<string, unknown>[] = [];
  if (filters.directions.length)
    and.push({ directions: { some: { direction: { code: { in: filters.directions } } } } });
  if (filters.category) and.push({ category: { code: filters.category } });
  if (filters.metal) and.push({ composition: { some: { metal: { name: { equals: filters.metal, mode: "insensitive" } } } } });
  return and.length ? { AND: and } : {};
}

function orderByFor(sort: CollectionFilters["sort"]) {
  if (sort === "price-asc") return { basePriceMinor: "asc" as const };
  if (sort === "price-desc") return { basePriceMinor: "desc" as const };
  return { createdAt: "desc" as const };
}

export async function getCollectionView(filters: CollectionFilters): Promise<CollectionView> {
  // Headless Shopify: when configured, the catalogue comes from Shopify. The
  // page and its components are unchanged — the view shape is identical. Dynamic
  // import keeps the Shopify (server-only) module out of the built-in path.
  if (isShopifyEnabled()) {
    const { getShopifyCollectionView } = await import("@/lib/shopify/collection-view");
    return getShopifyCollectionView(filters);
  }

  const hasFilters = filters.directions.length > 0 || !!filters.category || !!filters.metal;

  try {
    // ── Cheap aggregates: counts only, never the whole catalogue ──────────
    const [totalLive, dirRecords, dirCountRows, catCountRows, currency] = await Promise.all([
      prisma.product.count({ where: { status: "live" } }),
      prisma.direction.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
      prisma.productDirection.groupBy({ by: ["directionId"], where: { product: { status: "live" } }, _count: { _all: true } }),
      prisma.product.groupBy({ by: ["categoryId"], where: { status: "live" }, _count: { _all: true } }),
      resolveDisplayCurrency(),
    ]);

    const dirCount = new Map(dirCountRows.map((r) => [r.directionId, r._count._all]));
    const directions: DirectionView[] = dirRecords.map((d) => {
      const v = visualFor(d.code);
      return {
        code: d.code, name: d.name, sanskritName: d.sanskritName, deva: v.deva,
        element: d.element, governs: d.governs, microcopy: d.microcopy,
        productCount: dirCount.get(d.id) ?? 0, realProductCount: dirCount.get(d.id) ?? 0,
        iast: v.iast, deity: v.deity, color: v.color, colorDeep: v.colorDeep,
        angle: DIRECTION_ANGLE[d.code] ?? 0, liveCount: dirCount.get(d.id) ?? 0,
      };
    });

    // Category chips (leaf categories with live pieces).
    const catRecords = await prisma.category.findMany({ where: { id: { in: catCountRows.map((r) => r.categoryId) } } });
    const catName = new Map(catRecords.map((c) => [c.id, c]));
    const categories: CategoryView[] = catCountRows
      .map((r) => ({ code: catName.get(r.categoryId)?.code ?? "", name: catName.get(r.categoryId)?.name ?? "", count: r._count._all }))
      .filter((c) => c.code)
      .sort((a, b) => b.count - a.count);

    const base = { totalLive, directions, categories, currency, filters };

    // ── Grid mode: database-paginated set of matching pieces ──────────────
    if (hasFilters) {
      const where = { status: "live", ...filterWhere(filters) };
      const [matchCount, rows] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({ where, include: PIECE_INCLUDE, orderBy: orderByFor(filters.sort), take: filters.show }),
      ]);
      const pieces = rows.map((p) => toPiece(p, currency));
      return { ...base, mode: "grid", overview: [], unplaced: [], pieces, matchCount, shown: pieces.length, hasMore: matchCount > pieces.length };
    }

    // ── Overview mode: one capped preview query per non-empty direction ───
    const active = directions.filter((d) => d.liveCount > 0);
    const groups = await Promise.all(
      active.map(async (d) => {
        const rows = await prisma.product.findMany({
          where: { status: "live", directions: { some: { direction: { code: d.code } } } },
          include: PIECE_INCLUDE, orderBy: { createdAt: "desc" }, take: OVERVIEW_PER_DIR,
        });
        return { direction: d, items: rows.map((p) => toPiece(p, currency)), hasMore: d.liveCount > OVERVIEW_PER_DIR };
      }),
    );

    const unplacedRows = await prisma.product.findMany({
      where: { status: "live", directions: { none: {} } },
      include: PIECE_INCLUDE, orderBy: { createdAt: "desc" }, take: 48,
    });
    const unplaced = unplacedRows.map((p) => toPiece(p, currency));

    return { ...base, mode: "overview", overview: groups, unplaced, pieces: [], matchCount: totalLive, shown: totalLive, hasMore: false };
  } catch (err) {
    console.warn("[collection] load failed, rendering empty:", err instanceof Error ? err.message : err);
    return emptyView(filters);
  }
}

// URL helpers live in a client-safe module; re-exported here for server callers.
export { toQuery, toggleDirection } from "@/lib/collection-url";

/** Parse raw searchParams into typed CollectionFilters. */
export function parseFilters(sp: Record<string, string | undefined>): CollectionFilters {
  const directions = (sp.direction ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const sort: CollectionFilters["sort"] =
    sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "newest";
  const showRaw = Number(sp.show);
  const show = Number.isFinite(showRaw) && showRaw >= PAGE_SIZE ? Math.min(showRaw, 480) : PAGE_SIZE;
  return { directions, category: sp.category, metal: sp.metal, purpose: sp.purpose, sort, show };
}
