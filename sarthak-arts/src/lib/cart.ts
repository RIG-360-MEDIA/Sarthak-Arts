import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isShopifyEnabled } from "@/lib/shopify/config";

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
    include: { items: { include: { product: true, variant: true }, orderBy: { id: "asc" } } },
  });
}

type LineLike = { product: { name: string; basePriceMinor: number }; variant: { label: string; priceMinor: number | null } | null };
/** Price of one unit of a cart line: the option's own price, else the product's. */
export const lineUnitPrice = (i: LineLike) => i.variant?.priceMinor ?? i.product.basePriceMinor;
/** "Lotus Diya — Blue" for a line with an option. */
export const lineName = (i: LineLike) => (i.variant ? `${i.product.name} — ${i.variant.label}` : i.product.name);

/**
 * Add one unit. A product with options needs one chosen (variantId); the same
 * product+option stays on one line. Returns false if the option is invalid.
 */
export async function addItem(cartId: string, productId: number, variantId?: number | null): Promise<boolean> {
  const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
  const vId = variants.length === 0 ? null : variants.some((v) => v.id === variantId) ? variantId! : null;
  if (variants.length > 0 && vId === null) return false;
  const existing = await prisma.cartItem.findFirst({ where: { cartId, productId, variantId: vId } });
  if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: 1 } } });
  else await prisma.cartItem.create({ data: { cartId, productId, variantId: vId, quantity: 1 } });
  return true;
}

export async function setItemQuantity(cartId: string, itemId: number, quantity: number): Promise<void> {
  if (quantity <= 0) await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  else await prisma.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
}

/**
 * Peek at the cart's total item count without creating a cart cookie.
 * Safe to call from any server component (e.g. the homepage nav) — a fresh
 * visitor with no cookie yet returns 0 rather than provisioning a row.
 *
 * Cached in a short-lived cookie (30s) so repeated renders in quick
 * succession (nav on the homepage, PDP, direction pages) don't each hit
 * the database. The cache is invalidated whenever the cart is mutated via
 * bumpCartCountCache() below.
 */
const CART_COUNT_COOKIE = "cart_n_cache";
const CART_COUNT_TTL = 30; // seconds

export async function getCartItemCount(): Promise<number> {
  if (isShopifyEnabled()) {
    try {
      const { getSessionShopifyCart } = await import("@/lib/shopify/cart-session");
      return (await getSessionShopifyCart())?.totalQuantity ?? 0;
    } catch {
      return 0;
    }
  }
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return 0;
  const cached = jar.get(CART_COUNT_COOKIE)?.value;
  if (cached != null) {
    const n = Number(cached);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  try {
    const agg = await prisma.cartItem.aggregate({
      where: { cartId: id },
      _sum: { quantity: true },
    });
    const count = agg._sum.quantity ?? 0;
    // Best-effort cache. Setting cookies during a render throws ("can only be
    // modified in a Server Action") — swallow it; the count is still correct.
    try { jar.set(CART_COUNT_COOKIE, String(count), { sameSite: "lax", maxAge: CART_COUNT_TTL, path: "/" }); } catch { /* not in an action — skip caching */ }
    return count;
  } catch {
    // DB unreachable (Neon asleep) — a nav badge must never 500 the page.
    return 0;
  }
}

/**
 * Called by any cart-mutation server action (addItem, setItemQuantity, etc.)
 * to invalidate the count cache so the next render reflects the change.
 */
export async function bumpCartCountCache(): Promise<void> {
  const jar = await cookies();
  jar.delete(CART_COUNT_COOKIE);
}
