import type { CheckoutIntent, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateCertificates } from "@/lib/certificate";
import { sendOrderConfirmation } from "@/lib/email";
import { getSetting } from "@/lib/settings";

type SnapshotItem = { productId: number; name: string; unitPriceMinor: number; quantity: number; composition: unknown };

/** Big-order perk: an order over the threshold grants one free Vastu placement consultation. */
async function grantConsultationIfEligible(tx: Prisma.TransactionClient, order: { id: number; email: string; totalMinor: number }) {
  const thresholdMinor = await getSetting<number>("consultation_credit_threshold_minor", 1500000);
  if (order.totalMinor < thresholdMinor) return;
  const vastu = await tx.consultationType.findUnique({ where: { code: "vastu-placement" } });
  if (vastu) {
    await tx.consultationEntitlement.create({
      data: { customerEmail: order.email, sourceOrderId: order.id, consultationTypeId: vastu.id },
    });
  }
}

/**
 * Turn a checkout intent into an order: items, payment row, stock decrement, cart cleared.
 * A "confirmed" order is paid; a "pending_payment" order waits for the owner to verify a UPI transfer.
 */
async function createOrderFromIntent(
  intent: CheckoutIntent,
  opts: { statusCode: "confirmed" | "pending_payment"; paymentStatus: string; gatewayPaymentId: string; note: string },
) {
  const status = await prisma.orderStatus.findUniqueOrThrow({ where: { code: opts.statusCode } });
  const items = intent.cartSnapshot as SnapshotItem[];

  return prisma.$transaction(async (tx) => {
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
        statusId: status.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            unitPriceMinor: i.unitPriceMinor,
            quantity: i.quantity,
            compositionSnapshot: i.composition as object,
          })),
        },
        statusHistory: { create: { statusId: status.id, note: opts.note } },
        payments: {
          create: {
            gateway: intent.gatewayCode,
            gatewayOrderId: intent.gatewayOrderId,
            gatewayPaymentId: opts.gatewayPaymentId,
            amountMinor: intent.totalMinor,
            currency: intent.currency,
            status: opts.paymentStatus,
          },
        },
      },
      include: { items: true },
    });

    // Reserve the stock now (also for unverified UPI orders, so a piece can't be sold twice).
    // updateMany so a since-deleted product can't abort the order; a second pass clamps to zero.
    for (const i of items) {
      await tx.product.updateMany({ where: { id: i.productId }, data: { stockQuantity: { decrement: i.quantity } } });
    }
    await tx.product.updateMany({
      where: { id: { in: items.map((i) => i.productId) }, stockQuantity: { lt: 0 } },
      data: { stockQuantity: 0 },
    });

    await tx.checkoutIntent.update({ where: { id: intent.id }, data: { status: "completed" } });
    if (intent.cartId) await tx.cartItem.deleteMany({ where: { cartId: intent.cartId } });
    if (opts.statusCode === "confirmed") await grantConsultationIfEligible(tx, created);
    return created;
  });
}

/** Razorpay webhook path: payment already captured by the gateway. */
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

  const order = await createOrderFromIntent(intent, {
    statusCode: "confirmed", paymentStatus: "captured", gatewayPaymentId, note: "Payment captured",
  });
  await ensureFulfilmentArtifacts(order.id);
  return order;
}

export type UpiSubmitResult = { ok: true; orderNumber: string } | { ok: false; reason: "not_found" | "duplicate_utr" };

/** Customer says they paid by UPI and gives the transaction reference: create a pending order for the owner to verify. */
export async function submitUpiPayment(intentId: string, utr: string): Promise<UpiSubmitResult> {
  const intent = await prisma.checkoutIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.gatewayCode !== "upi") return { ok: false, reason: "not_found" };
  if (intent.status === "completed") {
    const existing = await prisma.order.findFirst({ where: { payments: { some: { gatewayOrderId: intent.gatewayOrderId } } } });
    return existing ? { ok: true, orderNumber: existing.orderNumber } : { ok: false, reason: "not_found" };
  }
  const reused = await prisma.payment.findFirst({ where: { gateway: "upi", gatewayPaymentId: utr } });
  if (reused) return { ok: false, reason: "duplicate_utr" };

  const order = await createOrderFromIntent(intent, {
    statusCode: "pending_payment", paymentStatus: "pending", gatewayPaymentId: utr,
    note: `UPI payment submitted — UTR ${utr}, awaiting verification`,
  });
  return { ok: true, orderNumber: order.orderNumber };
}

/** Owner confirms the UPI money arrived: the order becomes a normal paid order. */
export async function confirmUpiPayment(orderId: number): Promise<void> {
  const [order, confirmed] = await Promise.all([
    prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { status: true } }),
    prisma.orderStatus.findUniqueOrThrow({ where: { code: "confirmed" } }),
  ]);
  if (order.status.code !== "pending_payment") return;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { statusId: confirmed.id } });
    await tx.payment.updateMany({ where: { orderId, gateway: "upi" }, data: { status: "captured" } });
    await tx.orderStatusHistory.create({ data: { orderId, statusId: confirmed.id, note: "UPI payment verified by owner" } });
    await grantConsultationIfEligible(tx, order);
  });
  await ensureFulfilmentArtifacts(orderId);
}

/** Owner could not find the UPI payment: cancel the order and put the stock back. */
export async function rejectUpiPayment(orderId: number): Promise<void> {
  const [order, cancelled] = await Promise.all([
    prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { status: true, items: true } }),
    prisma.orderStatus.findUniqueOrThrow({ where: { code: "cancelled" } }),
  ]);
  if (order.status.code !== "pending_payment") return;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { statusId: cancelled.id } });
    await tx.payment.updateMany({ where: { orderId, gateway: "upi" }, data: { status: "failed" } });
    await tx.orderStatusHistory.create({ data: { orderId, statusId: cancelled.id, note: "UPI payment not received — order cancelled" } });
    for (const i of order.items) {
      await tx.product.updateMany({ where: { id: i.productId }, data: { stockQuantity: { increment: i.quantity } } });
    }
  });
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
