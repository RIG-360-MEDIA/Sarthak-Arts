import { shopifyFetch } from "./client";
import { PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from "./queries";
import type { ShopifyProduct } from "./types";
import { adaptShopifyProduct, type ShopifyPieceCard } from "./adapt";

// Re-export the pure adapter so existing importers keep working.
export { adaptShopifyProduct, type ShopifyPieceCard } from "./adapt";

/** All products (optionally filtered/sorted via Shopify's search syntax). */
export async function getShopifyProducts(opts: { first?: number; sortKey?: string; reverse?: boolean; query?: string } = {}): Promise<ShopifyPieceCard[]> {
  const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(PRODUCTS_QUERY, {
    first: opts.first ?? 48,
    sortKey: opts.sortKey ?? "CREATED_AT",
    reverse: opts.reverse ?? true,
    query: opts.query,
  });
  return data.products.nodes.map(adaptShopifyProduct);
}

/** A single product by its handle (slug). */
export async function getShopifyProduct(handle: string): Promise<ShopifyPieceCard | null> {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data.product ? adaptShopifyProduct(data.product) : null;
}
