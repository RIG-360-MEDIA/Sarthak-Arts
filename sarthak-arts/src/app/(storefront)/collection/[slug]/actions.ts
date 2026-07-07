"use server";
import { redirect } from "next/navigation";
import { addItem, getOrCreateCartId } from "@/lib/cart";

export async function addToCart(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const cartId = await getOrCreateCartId();
  await addItem(cartId, productId);
  redirect("/cart");
}
