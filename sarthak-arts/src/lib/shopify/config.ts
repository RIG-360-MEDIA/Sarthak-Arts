/**
 * Shopify Storefront configuration — read once, from the environment.
 *
 * Headless Shopify keeps our Next.js storefront as the "front" and uses Shopify
 * as the "engine" behind it (products, cart, checkout, payments). Everything in
 * this folder is gated behind `isShopifyEnabled()` so that until the store's
 * credentials are set, the platform keeps running on its existing backend and
 * nothing breaks.
 *
 * Required env (see docs/SHOPIFY_SETUP.md):
 *   SHOPIFY_STORE_DOMAIN            e.g. sarthak-arts.myshopify.com
 *   SHOPIFY_STOREFRONT_ACCESS_TOKEN the public Storefront API access token
 * Optional:
 *   SHOPIFY_API_VERSION            defaults to a recent stable quarter
 */

export const SHOPIFY_STORE_DOMAIN =
  (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

export const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  (process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "").trim();

export const SHOPIFY_API_VERSION = (process.env.SHOPIFY_API_VERSION ?? "").trim() || "2025-01";

/** Our Vāstu-specific data lives in Shopify metafields under this namespace. */
export const VASTU_METAFIELD_NAMESPACE = "vastu";

/** True only when both required credentials are present. */
export function isShopifyEnabled(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}
