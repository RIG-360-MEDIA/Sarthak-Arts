"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { nextStatusCode, FULFILLMENT_FLOW } from "@/lib/orderflow";

export async function advanceStatus(formData: FormData): Promise<void> {
  const orderId = Number(formData.get("orderId"));
  const currentCode = String(formData.get("currentCode"));
  const nextCode = nextStatusCode(currentCode, FULFILLMENT_FLOW);
  if (!nextCode) return;
  const next = await prisma.orderStatus.findUniqueOrThrow({ where: { code: nextCode } });
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { statusId: next.id } }),
    prisma.orderStatusHistory.create({ data: { orderId, statusId: next.id, note: `Advanced to ${next.name}` } }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
