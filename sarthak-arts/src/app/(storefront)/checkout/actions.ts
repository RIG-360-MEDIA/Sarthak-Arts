"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { computeTotals, zoneConfigForCountry } from "@/lib/totals";
import { createGatewayOrder } from "@/lib/payments/razorpay";
import { validateCheckout } from "@/lib/validation";

export async function beginCheckout(formData: FormData): Promise<void> {
  const cartId = (await cookies()).get("cart_id")?.value;
  const cart = cartId ? await getCartWithItems(cartId) : null;
  if (!cart || cart.items.length === 0) redirect("/cart");

  // Authoritative server-side validation — the browser's required/type hints
  // are UX only and can be bypassed.
  const parsed = validateCheckout({
    name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone"),
    line1: formData.get("line1"), city: formData.get("city"), state: formData.get("state"),
    postalCode: formData.get("postalCode"), country: formData.get("country"),
  });
  if (!parsed.ok) redirect("/checkout?error=1");
  const input = parsed.value;

  const items = cart.items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    unitPriceMinor: i.product.basePriceMinor,
    quantity: i.quantity,
  }));
  const subtotal = cartSubtotalMinor(items);
  const country = input.country;
  const totals = computeTotals(subtotal, await zoneConfigForCountry(country));

  const compositionByProduct: Record<number, unknown> = {};
  for (const i of cart.items) {
    const rows = await prisma.productComposition.findMany({
      where: { productId: i.productId },
      orderBy: { sortOrder: "asc" },
      include: { metal: true, gemstone: true },
    });
    compositionByProduct[i.productId] = rows.map((c) => ({
      material: c.metal?.name ?? c.gemstone?.name ?? "",
      label: c.label,
      weightGrams: c.weightGrams ? Number(c.weightGrams) : null,
      gemstoneQty: c.gemstoneQty,
    }));
  }

  // Open a payment with the gateway and record the intent. If the gateway is
  // unreachable or misconfigured, fail gracefully back to checkout with a
  // friendly message instead of a raw server-error page.
  let intentId: string;
  try {
    const gatewayOrder = await createGatewayOrder(totals.totalMinor, "INR", `cart_${cart.id.slice(0, 12)}`);
    const intent = await prisma.checkoutIntent.create({
      data: {
        cartId: cart.id,
        cartSnapshot: items.map((i) => ({ ...i, composition: compositionByProduct[i.productId] })) as unknown as Prisma.InputJsonValue,
        email: input.email,
        phone: input.phone,
        shippingAddress: {
          name: input.name,
          line1: input.line1,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country,
        },
        currency: "INR",
        ...totals,
        isGift: formData.get("isGift") === "on",
        giftNote: (formData.get("giftNote") as string)?.trim() || null,
        gatewayCode: "razorpay",
        gatewayOrderId: String(gatewayOrder.id),
      },
    });
    intentId = intent.id;
  } catch (err) {
    console.error("[checkout] could not start payment:", err instanceof Error ? err.message : err);
    redirect("/checkout?error=payment");
  }

  redirect(`/checkout/pay/${intentId}`);
}
