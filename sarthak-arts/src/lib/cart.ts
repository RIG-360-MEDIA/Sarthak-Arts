import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export function cartSubtotalMinor(items: Array<{ unitPriceMinor: number; quantity: number }>): number {
  return items.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0);
}

const CART_COOKIE = "cart_id";

export async function getOrCreateCartId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing && (await prisma.cart.findUnique({ where: { id: existing } }))) return existing;
  const cart = await prisma.cart.create({ data: {} });
  jar.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return cart.id;
}

export async function getCartWithItems(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true }, orderBy: { id: "asc" } } },
  });
}

export async function addItem(cartId: string, productId: number): Promise<void> {
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: { increment: 1 } },
    create: { cartId, productId, quantity: 1 },
  });
}

export async function setItemQuantity(cartId: string, productId: number, quantity: number): Promise<void> {
  if (quantity <= 0) await prisma.cartItem.deleteMany({ where: { cartId, productId } });
  else await prisma.cartItem.update({ where: { cartId_productId: { cartId, productId } }, data: { quantity } });
}
