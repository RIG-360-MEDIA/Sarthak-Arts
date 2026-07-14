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

/**
 * Peek at the cart's total item count without creating a cart cookie.
 * Safe to call from any server component (e.g. the homepage nav) — a fresh
 * visitor with no cookie yet returns 0 rather than provisioning a row.
 */
export async function getCartItemCount(): Promise<number> {
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return 0;
  const agg = await prisma.cartItem.aggregate({
    where: { cartId: id },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
