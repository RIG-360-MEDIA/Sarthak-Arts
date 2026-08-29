import { prisma } from "@/lib/db";
import { generateCertificates } from "@/lib/certificate";
import { sendOrderConfirmation } from "@/lib/email";
import { getSetting } from "@/lib/settings";

export async function completeIntent(gatewayOrderId: string, gatewayPaymentId: string) {
  const intent = await prisma.checkoutIntent.findUnique({ where: { gatewayOrderId } });
  if (!intent) throw new Error(`No checkout intent for gateway order ${gatewayOrderId}`);

  // Idempotent — gateways may deliver a webhook more than once. If the order was
  // already created, don't create it again; but DO make sure the fulfilment
  // artifacts (certificate + email) exist, in case an earlier attempt failed
  // after the order committed but before/while generating them.
  if (intent.status === "completed") {
    const existing = await prisma.order.findFirst({ where: { payments: { some: { gatewayOrderId } } } });
    if (existing) await ensureFulfilmentArtifacts(existing.id);
    return existing;
  }

  const confirmed = await prisma.orderStatus.findUniqueOrThrow({ where: { code: "confirmed" } });
  const items = intent.cartSnapshot as Array<{
    productId: number; name: string; unitPriceMinor: number; quantity: number; composition: unknown;
  }>;

  // Big-order perk: an order over the threshold grants one free Vastu placement
  // consultation (the announcement-bar promise). Resolve it before the transaction
  // so the grant can be written atomically with the order.
  const thresholdMinor = await getSetting<number>("consultation_credit_threshold_minor", 1500000);
  const vastu = intent.totalMinor >= thresholdMinor
    ? await prisma.consultationType.findUnique({ where: { code: "vastu-placement" } })
    : null;

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
        isGift: intent.isGift,
        giftNote: intent.giftNote,
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

    // Reduce inventory for each piece sold, atomically with the order.
    // updateMany (not update) so a since-deleted product can't abort the whole
    // order; a second pass clamps any oversold count to zero.
    for (const i of items) {
      await tx.product.updateMany({ where: { id: i.productId }, data: { stockQuantity: { decrement: i.quantity } } });
    }
    await tx.product.updateMany({
      where: { id: { in: items.map((i) => i.productId) }, stockQuantity: { lt: 0 } },
      data: { stockQuantity: 0 },
    });

    await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: "completed" } });
    if (intent.cartId) await tx.cartItem.deleteMany({ where: { cartId: intent.cartId } });
    if (vastu) {
      await tx.consultationEntitlement.create({
        data: { customerEmail: created.email, sourceOrderId: created.id, consultationTypeId: vastu.id },
      });
    }
    return created;
  });

  await ensureFulfilmentArtifacts(order.id);
  return order;
}

/**
 * Generate the certificate (once) and send the confirmation email for an order.
 * Idempotent on certificates and wrapped so a failure here never rejects the
 * webhook — a rejected webhook would make the gateway retry, and the retry would
 * hit the "already completed" guard and skip regeneration, silently losing the
 * certificate. Failures are logged for follow-up instead.
 */
async function ensureFulfilmentArtifacts(orderId: number): Promise<void> {
  try {
    const certCount = await prisma.orderCertificate.count({ where: { orderId } });
    if (certCount === 0) await generateCertificates(orderId);
    await sendOrderConfirmation(orderId);
  } catch (err) {
    console.error(`[orders] fulfilment artifacts failed for order ${orderId}:`, err instanceof Error ? err.message : err);
  }
}
