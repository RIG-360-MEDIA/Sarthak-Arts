"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveImage, deleteImageByUrl } from "@/lib/uploads";
import { deleteProducts } from "@/lib/product-delete";

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
  redirect(`/admin/products/${product.id}?flash=created`);
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

  if (formData.has("directionId")) {
    const directionId = Number(formData.get("directionId"));
    const current = await prisma.productDirection.findMany({ where: { productId: id }, orderBy: { directionId: "asc" } });
    // The form shows one direction; only rewrite when the owner picks a different one.
    if ((current[0]?.directionId ?? 0) !== directionId) {
      await prisma.productDirection.deleteMany({ where: { productId: id } });
      if (directionId) await prisma.productDirection.create({ data: { productId: id, directionId } });
    }
  }

  if (newPriceMinor !== existing.basePriceMinor) {
    await prisma.productPriceHistory.create({
      data: { productId: id, oldPriceMinor: existing.basePriceMinor, newPriceMinor },
    });
  }
  redirect(`/admin/products/${id}?flash=saved`);
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

// ── Product images ─────────────────────────────────────────────────────────

export async function uploadProductImage(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const file = formData.get("file") as File | null;
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { name: true } });
  if (!file || file.size === 0) return;

  const saved = await saveImage(file, `products/${productId}`);
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url: saved.url, alt: product.name, sortOrder: count },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function removeProductImage(formData: FormData): Promise<void> {
  const imageId = Number(formData.get("imageId"));
  const productId = Number(formData.get("productId"));
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  await prisma.productImage.delete({ where: { id: imageId } });

  // Best-effort: remove the stored object (local disk or R2/S3).
  if (image?.url) {
    try { await deleteImageByUrl(image.url); } catch { /* already gone — fine */ }
  }
  revalidatePath(`/admin/products/${productId}`);
}

export async function makePrimaryImage(formData: FormData): Promise<void> {
  const imageId = Number(formData.get("imageId"));
  const productId = Number(formData.get("productId"));
  const images = await prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
  const reordered = [images.find((i) => i.id === imageId)!, ...images.filter((i) => i.id !== imageId)].filter(Boolean);
  await prisma.$transaction(reordered.map((img, i) => prisma.productImage.update({ where: { id: img.id }, data: { sortOrder: i } })));
  revalidatePath(`/admin/products/${productId}`);
}

// ── Delete ────────────────────────────────────────────────────────────────

const STATUS_TABS = new Set(["live", "draft", "archived"]);

function afterDelete(r: { deleted: number; archived: number }, status: FormDataEntryValue | null): never {
  revalidatePath("/admin/products");
  revalidatePath("/collection");
  revalidatePath("/");
  const tab = STATUS_TABS.has(String(status)) ? `&status=${status}` : "";
  redirect(`/admin/products?deleted=${r.deleted}&archived=${r.archived}${tab}`);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  afterDelete(await deleteProducts([Number(formData.get("id"))]), formData.get("returnStatus"));
}

export async function deleteSelectedProducts(formData: FormData): Promise<void> {
  const ids = formData.getAll("ids").map(Number);
  if (ids.length === 0) redirect("/admin/products");
  afterDelete(await deleteProducts(ids), formData.get("returnStatus"));
}

const BULK_STATUSES = new Set(["live", "draft", "archived"]);

/** One form, several buttons: the clicked button's name="intent" says what to do with the ticked products. */
export async function bulkProductAction(formData: FormData): Promise<void> {
  const intent = String(formData.get("intent"));
  if (intent === "delete") return deleteSelectedProducts(formData);

  const ids = [...new Set(formData.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const tab = STATUS_TABS.has(String(formData.get("returnStatus"))) ? `&status=${formData.get("returnStatus")}` : "";
  if (ids.length === 0 || !BULK_STATUSES.has(intent)) redirect(`/admin/products${tab ? `?${tab.slice(1)}` : ""}`);

  const { count } = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: intent } });
  revalidatePath("/admin/products");
  revalidatePath("/collection");
  revalidatePath("/");
  redirect(`/admin/products?updated=${count}&to=${intent}${tab}`);
}
