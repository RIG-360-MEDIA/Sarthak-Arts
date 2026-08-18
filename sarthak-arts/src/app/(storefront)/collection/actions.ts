"use server";
import { addItem, getOrCreateCartId, bumpCartCountCache } from "@/lib/cart";

/**
 * Add a piece to the cart from the collection grid, WITHOUT redirecting — the
 * grid stays put and the client shows a toast. (The PDP's addToCart redirects
 * to /cart; this inline variant is for browsing.)
 */
export async function addToCartInline(productId: number): Promise<void> {
  const cartId = await getOrCreateCartId();
  await addItem(cartId, productId);
  await bumpCartCountCache();
}
