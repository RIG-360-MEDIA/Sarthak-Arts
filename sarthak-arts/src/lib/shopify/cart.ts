import { shopifyFetch } from "./client";
import {
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from "./queries";
import type { ShopifyCart } from "./types";

type UserError = { field: string[] | null; message: string };
type CartMutationResult = { cart: ShopifyCart | null; userErrors: UserError[] };

function unwrap(r: CartMutationResult): ShopifyCart {
  if (r.userErrors?.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
  if (!r.cart) throw new Error("Shopify returned no cart.");
  return r.cart;
}

/** Create a cart with an initial line. Persist `cart.id` in a cookie. */
export async function createShopifyCart(variantId: string, quantity = 1): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartCreate: CartMutationResult }>(CART_CREATE_MUTATION, {
    lines: [{ merchandiseId: variantId, quantity }],
  });
  return unwrap(data.cartCreate);
}

/** Fetch a cart by id (returns null if it has expired/been checked out). */
export async function getShopifyCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(CART_QUERY, { id: cartId });
  return data.cart;
}

export async function addShopifyCartLine(cartId: string, variantId: string, quantity = 1): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartMutationResult }>(CART_LINES_ADD_MUTATION, {
    cartId, lines: [{ merchandiseId: variantId, quantity }],
  });
  return unwrap(data.cartLinesAdd);
}

/** Set a line's quantity. Quantity 0 with removeShopifyCartLine is preferred for removal. */
export async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartMutationResult }>(CART_LINES_UPDATE_MUTATION, {
    cartId, lines: [{ id: lineId, quantity }],
  });
  return unwrap(data.cartLinesUpdate);
}

export async function removeShopifyCartLine(cartId: string, lineId: string): Promise<ShopifyCart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartMutationResult }>(CART_LINES_REMOVE_MUTATION, {
    cartId, lineIds: [lineId],
  });
  return unwrap(data.cartLinesRemove);
}
