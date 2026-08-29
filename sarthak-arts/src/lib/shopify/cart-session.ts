import "server-only";
import { cookies } from "next/headers";
import {
  createShopifyCart,
  getShopifyCart,
  addShopifyCartLine,
  updateShopifyCartLine,
  removeShopifyCartLine,
} from "./cart";
import type { ShopifyCart } from "./types";

/**
 * The visitor's Shopify cart, keyed by a cookie holding the Shopify cart id.
 * Mirrors how the built-in cart uses a cart_id cookie, so the storefront flow is
 * the same shape in either mode. Mutations here must run inside Server Actions.
 */
const COOKIE = "shopify_cart_id";
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

/** Read the current Shopify cart (null if none / expired / already checked out). */
export async function getSessionShopifyCart(): Promise<ShopifyCart | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  try {
    return await getShopifyCart(id);
  } catch {
    return null;
  }
}

/** Add a variant to the cart, creating one if needed. Persists the cart id. */
export async function addToSessionCart(variantId: string, quantity = 1): Promise<ShopifyCart> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  let cart: ShopifyCart;
  if (id) {
    try {
      cart = await addShopifyCartLine(id, variantId, quantity);
    } catch {
      cart = await createShopifyCart(variantId, quantity); // cart expired — start fresh
    }
  } else {
    cart = await createShopifyCart(variantId, quantity);
  }
  jar.set(COOKIE, cart.id, COOKIE_OPTS);
  return cart;
}

/** Set a line's quantity (0 removes it). Returns null if there's no cart. */
export async function setSessionLineQuantity(lineId: string, quantity: number): Promise<ShopifyCart | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  return quantity <= 0
    ? removeShopifyCartLine(id, lineId)
    : updateShopifyCartLine(id, lineId, quantity);
}
