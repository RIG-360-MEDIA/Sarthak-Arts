"use server";
import { revalidatePath } from "next/cache";
import { getOrCreateCartId, setItemQuantity, bumpCartCountCache } from "@/lib/cart";

export async function updateQuantity(formData: FormData): Promise<void> {
  const cartId = await getOrCreateCartId();
  await setItemQuantity(cartId, Number(formData.get("productId")), Number(formData.get("quantity")));
  await bumpCartCountCache(); // keep the nav cart badge in sync
  revalidatePath("/cart");
}

/** Headless Shopify: set a Shopify cart line's quantity (0 removes it). */
export async function updateShopifyLine(formData: FormData): Promise<void> {
  const { setSessionLineQuantity } = await import("@/lib/shopify/cart-session");
  await setSessionLineQuantity(String(formData.get("lineId")), Number(formData.get("quantity")));
  revalidatePath("/cart");
}
