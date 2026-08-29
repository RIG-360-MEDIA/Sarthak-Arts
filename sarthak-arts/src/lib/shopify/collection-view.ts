import "server-only";
import type { CollectionFilters, CollectionView, DirectionView, CategoryView, PieceCard } from "@/lib/collection";
import { OVERVIEW_PER_DIR, PAGE_SIZE } from "@/lib/collection";
import { getAllDirections } from "@/lib/direction";
import { visualFor, DIRECTION_ANGLE } from "@/lib/direction-visual";
import { getShopifyProducts, type ShopifyPieceCard } from "./products";

/**
 * Build the exact same `CollectionView` our collection page already consumes —
 * but sourced from Shopify. Products come from the Storefront API; direction
 * reference data (names, element, governs) stays in Neon, since it's editorial
 * reference, not commerce. Boutique catalogues are small, so we fetch and shape
 * in memory (Shopify cursor pagination can replace this during live testing).
 *
 * Called only when `isShopifyEnabled()` — see getCollectionView in lib/collection.
 */
const CATEGORY_LABELS: Record<string, string> = {
  kalash: "Kalash", yantra: "Yantra", pyramid: "Pyramid", panel: "Wall Panel", chime: "Wind Chime", murtis: "Murtis",
};

export async function getShopifyCollectionView(filters: CollectionFilters): Promise<CollectionView> {
  const hasFilters = filters.directions.length > 0 || !!filters.category || !!filters.metal;
  const empty: CollectionView = {
    mode: "overview", overview: [], pieces: [], matchCount: 0, shown: 0, hasMore: false,
    totalLive: 0, directions: [], categories: [], currency: { code: "INR", ratePerBase: 1 }, filters,
  };

  let all: ShopifyPieceCard[];
  let dirCards: Awaited<ReturnType<typeof getAllDirections>>;
  try {
    [all, dirCards] = await Promise.all([getShopifyProducts({ first: 250 }), getAllDirections()]);
  } catch (err) {
    console.warn("[shopify/collection] load failed:", err instanceof Error ? err.message : err);
    return empty;
  }

  // Prices are already formatted by the adapter (in the store's currency); the
  // collection view's `currency` is only metadata here, so INR/1 is fine.
  const currency = { code: "INR", ratePerBase: 1 };

  // Directions (reference metadata from Neon) + live counts from Shopify pieces.
  const directions: DirectionView[] = dirCards.map((d) => {
    const v = visualFor(d.code);
    const liveCount = all.filter((p) => p.directionCode === d.code).length;
    return {
      ...d, iast: v.iast, deity: v.deity, color: v.color, colorDeep: v.colorDeep,
      angle: DIRECTION_ANGLE[d.code] ?? 0, liveCount,
    };
  });

  // Categories from Shopify product types that actually have pieces.
  const catCount = new Map<string, number>();
  for (const p of all) if (p.categoryCode) catCount.set(p.categoryCode, (catCount.get(p.categoryCode) ?? 0) + 1);
  const categories: CategoryView[] = [...catCount.entries()]
    .map(([code, count]) => ({ code, name: CATEGORY_LABELS[code] ?? code, count }))
    .sort((a, b) => b.count - a.count);

  const base = { totalLive: all.length, directions, categories, currency, filters };
  const asPiece = (p: ShopifyPieceCard): PieceCard => p; // ShopifyPieceCard extends PieceCard

  const sortPieces = (list: ShopifyPieceCard[]) => {
    if (filters.sort === "price-asc") return [...list].sort((a, b) => a.priceMinor - b.priceMinor);
    if (filters.sort === "price-desc") return [...list].sort((a, b) => b.priceMinor - a.priceMinor);
    return list; // Shopify already returns newest-first
  };

  if (hasFilters) {
    let matched = all.filter((p) => {
      if (filters.directions.length && !filters.directions.includes(p.directionCode)) return false;
      if (filters.category && p.categoryCode !== filters.category) return false;
      if (filters.metal && (p.primaryMetalName ?? "").toLowerCase() !== filters.metal.toLowerCase()) return false;
      return true;
    });
    matched = sortPieces(matched);
    const shown = matched.slice(0, filters.show);
    return { ...base, mode: "grid", overview: [], pieces: shown.map(asPiece), matchCount: matched.length, shown: shown.length, hasMore: matched.length > shown.length };
  }

  // Overview: capped preview per non-empty direction.
  const overview = directions
    .filter((d) => d.liveCount > 0)
    .map((d) => {
      const items = all.filter((p) => p.directionCode === d.code).slice(0, OVERVIEW_PER_DIR).map(asPiece);
      return { direction: d, items, hasMore: d.liveCount > OVERVIEW_PER_DIR };
    });
  return { ...base, mode: "overview", overview, pieces: [], matchCount: all.length, shown: all.length, hasMore: false };
}

export { PAGE_SIZE };
