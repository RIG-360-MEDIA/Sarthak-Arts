"use server";
import { addItem, getOrCreateCartId, bumpCartCountCache } from "@/lib/cart";
import { isShopifyEnabled } from "@/lib/shopify/config";

/**
 * Add a piece to the cart from the collection grid, WITHOUT redirecting — the
 * grid stays put and the client shows a toast. (The PDP's addToCart redirects
 * to /cart; this inline variant is for browsing.)
 *
 * In headless Shopify mode the piece is added to the Shopify cart by its
 * variant id; otherwise to the built-in cart by product id.
 */
export async function addToCartInline(productId: number, variantId?: string): Promise<void> {
  if (isShopifyEnabled() && variantId) {
    const { addToSessionCart } = await import("@/lib/shopify/cart-session");
    await addToSessionCart(variantId, 1);
    return;
  }
  const cartId = await getOrCreateCartId();
  await addItem(cartId, productId);
  await bumpCartCountCache();
}
