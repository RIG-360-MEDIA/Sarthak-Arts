import "server-only";
import { prisma } from "@/lib/db";
import { deleteImageByUrl } from "@/lib/uploads";

export type DeleteResult = { deleted: number; archived: number };

/**
 * Permanently remove products from the shop and the database.
 * Products that appear in past orders can't be removed without breaking those
 * orders' records, so they are archived (hidden everywhere) instead.
 */
export async function deleteProducts(ids: number[]): Promise<DeleteResult> {
  const unique = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))];
  if (unique.length === 0) return { deleted: 0, archived: 0 };

  const ordered = await prisma.orderItem.findMany({
    where: { productId: { in: unique } }, select: { productId: true }, distinct: ["productId"],
  });
  const keep = new Set(ordered.map((o) => o.productId));
  const removable = unique.filter((id) => !keep.has(id));

  if (keep.size > 0) {
    await prisma.product.updateMany({ where: { id: { in: [...keep] } }, data: { status: "archived" } });
  }

  if (removable.length > 0) {
    const images = await prisma.productImage.findMany({ where: { productId: { in: removable } }, select: { url: true } });
    const where = { productId: { in: removable } };
    await prisma.$transaction([
      prisma.review.deleteMany({ where }),
      prisma.cartItem.deleteMany({ where }),
      prisma.productImage.deleteMany({ where }),
      prisma.productComposition.deleteMany({ where }),
      prisma.productDirection.deleteMany({ where }),
      prisma.productPurpose.deleteMany({ where }),
      prisma.productPriceHistory.deleteMany({ where }),
      prisma.product.deleteMany({ where: { id: { in: removable } } }),
    ]);
    // Photo files in storage — best-effort once the rows are gone.
    await Promise.allSettled(images.map((i) => deleteImageByUrl(i.url)));
  }

  return { deleted: removable.length, archived: keep.size };
}
