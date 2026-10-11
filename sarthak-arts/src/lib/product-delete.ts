import "server-only";
import { prisma } from "@/lib/db";
import { deleteImageByUrl } from "@/lib/uploads";

export type DeleteResult = { deleted: number; archived: number };

/**
 * Remove products from the shop and the database.
 *
 * A product that appears in past orders is archived on the first delete (hidden
 * everywhere, still restorable). Deleting it again once it is archived removes it
 * for good: its order lines are unlinked but keep their own name, price and
 * composition snapshot, so past orders and invoices still read correctly.
 */
export async function deleteProducts(ids: number[]): Promise<DeleteResult> {
  const unique = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))];
  if (unique.length === 0) return { deleted: 0, archived: 0 };

  const products = await prisma.product.findMany({ where: { id: { in: unique } }, select: { id: true, status: true } });
  const ordered = await prisma.orderItem.findMany({
    where: { productId: { in: unique } }, select: { productId: true }, distinct: ["productId"],
  });
  const hasOrders = new Set(ordered.map((o) => o.productId as number));

  const toArchive = products.filter((p) => hasOrders.has(p.id) && p.status !== "archived").map((p) => p.id);
  const toRemove = products.filter((p) => !toArchive.includes(p.id)).map((p) => p.id);

  if (toArchive.length > 0) {
    await prisma.product.updateMany({ where: { id: { in: toArchive } }, data: { status: "archived" } });
  }

  if (toRemove.length > 0) {
    const images = await prisma.productImage.findMany({ where: { productId: { in: toRemove } }, select: { url: true } });
    const where = { productId: { in: toRemove } };
    await prisma.$transaction([
      prisma.orderItem.updateMany({ where, data: { productId: null } }),
      prisma.review.deleteMany({ where }),
      prisma.cartItem.deleteMany({ where }),
      prisma.productImage.deleteMany({ where }),
      prisma.productComposition.deleteMany({ where }),
      prisma.productDirection.deleteMany({ where }),
      prisma.productPurpose.deleteMany({ where }),
      prisma.productPriceHistory.deleteMany({ where }),
      prisma.product.deleteMany({ where: { id: { in: toRemove } } }),
    ]);
    // Photo files in storage — best-effort once the rows are gone.
    await Promise.allSettled(images.map((i) => deleteImageByUrl(i.url)));
  }

  return { deleted: toRemove.length, archived: toArchive.length };
}
