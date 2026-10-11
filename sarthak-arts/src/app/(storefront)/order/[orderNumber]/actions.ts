"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function submitReview(formData: FormData): Promise<void> {
  const orderItemId = Number(formData.get("orderItemId"));
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: { include: { status: true } }, review: true, returnRequest: true } });
  // The item must belong to the order the visitor unlocked with its order number + email.
  if (item.order.email.toLowerCase() !== String(formData.get("email") ?? "").trim().toLowerCase()) return;
  if (item.productId === null || item.review || item.order.status.code !== "delivered") return;
  await prisma.review.create({
    data: {
      productId: item.productId,
      orderItemId,
      customerName: String(formData.get("name")),
      customerEmail: item.order.email,
      rating: Math.max(1, Math.min(5, Number(formData.get("rating")))),
      body: String(formData.get("body")),
      verifiedPurchase: true,
    },
  });
  revalidatePath(`/order/${item.order.orderNumber}`);
}

export async function requestReturn(formData: FormData): Promise<void> {
  const orderItemId = Number(formData.get("orderItemId"));
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: { include: { status: true } }, review: true, returnRequest: true } });
  // The item must belong to the order the visitor unlocked with its order number + email.
  if (item.order.email.toLowerCase() !== String(formData.get("email") ?? "").trim().toLowerCase()) return;
  if (item.returnRequest || item.order.status.code !== "delivered") return;
  await prisma.returnRequest.create({
    data: {
      orderItemId,
      reasonId: Number(formData.get("reasonId")),
      customerNote: (formData.get("note") as string) || null,
    },
  });
  revalidatePath(`/order/${item.order.orderNumber}`);
}
