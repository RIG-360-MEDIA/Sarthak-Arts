"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function submitReview(formData: FormData): Promise<void> {
  const orderItemId = Number(formData.get("orderItemId"));
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: true } });
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
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { order: true } });
  await prisma.returnRequest.create({
    data: {
      orderItemId,
      reasonId: Number(formData.get("reasonId")),
      customerNote: (formData.get("note") as string) || null,
    },
  });
  revalidatePath(`/order/${item.order.orderNumber}`);
}
