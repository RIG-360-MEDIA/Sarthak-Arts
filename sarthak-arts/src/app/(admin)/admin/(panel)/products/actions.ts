"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createProduct(formData: FormData): Promise<void> {
  const name = String(formData.get("name"));
  const categoryId = Number(formData.get("categoryId"));
  const product = await prisma.product.create({
    data: {
      name,
      slug: slugify(name) || `product-${Date.now()}`,
      positioningLine: String(formData.get("positioningLine") ?? ""),
      placementNote: String(formData.get("placementNote") ?? ""),
      description: String(formData.get("description") ?? ""),
      careNote: String(formData.get("careNote") ?? ""),
      includedItems: String(formData.get("includedItems") ?? ""),
      basePriceMinor: Math.round(Number(formData.get("priceRupees") ?? 0) * 100),
      stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      status: String(formData.get("status") ?? "draft"),
      categoryId,
    },
  });
  const directionId = Number(formData.get("directionId"));
  if (directionId) await prisma.productDirection.create({ data: { productId: product.id, directionId } });
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
  const newPriceMinor = Math.round(Number(formData.get("priceRupees") ?? 0) * 100);

  await prisma.product.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      positioningLine: String(formData.get("positioningLine") ?? ""),
      placementNote: String(formData.get("placementNote") ?? ""),
      description: String(formData.get("description") ?? ""),
      careNote: String(formData.get("careNote") ?? ""),
      includedItems: String(formData.get("includedItems") ?? ""),
      basePriceMinor: newPriceMinor,
      stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      status: String(formData.get("status") ?? "draft"),
      isFinalSale: formData.get("isFinalSale") === "on",
    },
  });

  if (newPriceMinor !== existing.basePriceMinor) {
    await prisma.productPriceHistory.create({
      data: { productId: id, oldPriceMinor: existing.basePriceMinor, newPriceMinor },
    });
  }
  revalidatePath(`/admin/products/${id}`);
}

export async function addComposition(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const metalId = formData.get("metalId") ? Number(formData.get("metalId")) : null;
  const gemstoneId = formData.get("gemstoneId") ? Number(formData.get("gemstoneId")) : null;
  await prisma.productComposition.create({
    data: {
      productId,
      metalId,
      gemstoneId,
      weightGrams: formData.get("weightGrams") ? Number(formData.get("weightGrams")) : null,
      gemstoneQty: formData.get("gemstoneQty") ? Number(formData.get("gemstoneQty")) : null,
      label: (formData.get("label") as string) || null,
    },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function removeComposition(formData: FormData): Promise<void> {
  const compositionId = Number(formData.get("compositionId"));
  const productId = Number(formData.get("productId"));
  await prisma.productComposition.delete({ where: { id: compositionId } });
  revalidatePath(`/admin/products/${productId}`);
}
