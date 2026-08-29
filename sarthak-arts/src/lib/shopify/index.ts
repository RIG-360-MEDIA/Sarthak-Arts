/**
 * Shopify (headless) integration — barrel export.
 *
 * Storefront design stays ours; Shopify is the engine behind it (catalogue,
 * cart, and its hosted checkout for payments). Everything here is gated behind
 * `isShopifyEnabled()` — until credentials are set the platform runs on its
 * existing backend untouched. See docs/SHOPIFY_SETUP.md to switch it on.
 */
export { isShopifyEnabled, SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION, VASTU_METAFIELD_NAMESPACE } from "./config";
export { shopifyFetch } from "./client";
export {
  getShopifyProducts,
  getShopifyProduct,
  adaptShopifyProduct,
  type ShopifyPieceCard,
} from "./products";
export {
  createShopifyCart,
  getShopifyCart,
  addShopifyCartLine,
  updateShopifyCartLine,
  removeShopifyCartLine,
} from "./cart";
export type { ShopifyProduct, ShopifyCart, CartLine, ProductVariant } from "./types";
export { VASTU_METAFIELD_KEYS } from "./types";
