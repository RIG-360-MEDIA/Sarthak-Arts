import { prisma } from "@/lib/db";
import { generateCertificates } from "@/lib/certificate";
import { sendOrderConfirmation } from "@/lib/email";
import { getSetting } from "@/lib/settings";

export async function completeIntent(gatewayOrderId: string, gatewayPaymentId: string) {
  const intent = await prisma.checkoutIntent.findUnique({ where: { gatewayOrderId } });
  if (!intent) throw new Error(`No checkout intent for gateway order ${gatewayOrderId}`);
  if (intent.status === "completed") return null; // idempotent — gateways may deliver webhooks more than once

  const confirmed = await prisma.orderStatus.findUniqueOrThrow({ where: { code: "confirmed" } });
  const items = intent.cartSnapshot as Array<{
    productId: number; name: string; unitPriceMinor: number; quantity: number; composition: unknown;
  }>;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: `SA-${Date.now().toString(36).toUpperCase()}`,
        email: intent.email,
        phone: intent.phone,
        currency: intent.currency,
        subtotalMinor: intent.subtotalMinor,
        shippingMinor: intent.shippingMinor,
        taxMinor: intent.taxMinor,
        totalMinor: intent.totalMinor,
        shippingAddress: intent.shippingAddress as object,
        statusId: confirmed.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            unitPriceMinor: i.unitPriceMinor,
            quantity: i.quantity,
            compositionSnapshot: i.composition as object,
          })),
        },
        statusHistory: { create: { statusId: confirmed.id, note: "Payment captured" } },
        payments: {
          create: {
            gateway: intent.gatewayCode,
            gatewayOrderId,
            gatewayPaymentId,
            amountMinor: intent.totalMinor,
            currency: intent.currency,
            status: "captured",
          },
        },
      },
      include: { items: true },
    });
    await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: "completed" } });
    if (intent.cartId) await tx.cartItem.deleteMany({ where: { cartId: intent.cartId } });
    return created;
  });

  // Big-order perk: an order over the threshold grants one free Vastu placement consultation
  // (the announcement bar promise). Threshold + granted type are settings/reference data.
  const thresholdMinor = await getSetting<number>("consultation_credit_threshold_minor", 1500000);
  if (order.totalMinor >= thresholdMinor) {
    const vastu = await prisma.consultationType.findUnique({ where: { code: "vastu-placement" } });
    if (vastu) {
      await prisma.consultationEntitlement.create({
        data: { customerEmail: order.email, sourceOrderId: order.id, consultationTypeId: vastu.id },
      });
    }
  }

  await generateCertificates(order.id);
  await sendOrderConfirmation(order.id);
  return order;
}
