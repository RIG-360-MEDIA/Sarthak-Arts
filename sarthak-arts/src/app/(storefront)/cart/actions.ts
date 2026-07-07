"use server";
import { revalidatePath } from "next/cache";
import { getOrCreateCartId, setItemQuantity } from "@/lib/cart";

export async function updateQuantity(formData: FormData): Promise<void> {
  const cartId = await getOrCreateCartId();
  await setItemQuantity(cartId, Number(formData.get("productId")), Number(formData.get("quantity")));
  revalidatePath("/cart");
}
