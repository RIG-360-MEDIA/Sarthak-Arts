"use server";
import { redirect } from "next/navigation";
import { addItem, getOrCreateCartId } from "@/lib/cart";
import { isShopifyEnabled } from "@/lib/shopify/config";

export async function addToCart(formData: FormData): Promise<void> {
  const variantId = String(formData.get("variantId") ?? "");
  if (isShopifyEnabled() && variantId) {
    const { addToSessionCart } = await import("@/lib/shopify/cart-session");
    await addToSessionCart(variantId, 1);
    redirect("/cart");
  }
  const productId = Number(formData.get("productId"));
  const cartId = await getOrCreateCartId();
  await addItem(cartId, productId);
  redirect("/cart");
}

/** "Order now": put the piece in the cart and go straight to checkout. */
export async function buyNow(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const cartId = await getOrCreateCartId();
  await addItem(cartId, productId);
  redirect("/checkout");
}
