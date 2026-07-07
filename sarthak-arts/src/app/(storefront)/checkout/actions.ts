"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { computeTotals, zoneConfigForCountry } from "@/lib/totals";
import { createGatewayOrder } from "@/lib/payments/razorpay";

export async function beginCheckout(formData: FormData): Promise<void> {
  const cartId = (await cookies()).get("cart_id")?.value;
  const cart = cartId ? await getCartWithItems(cartId) : null;
  if (!cart || cart.items.length === 0) redirect("/cart");

  const items = cart.items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    unitPriceMinor: i.product.basePriceMinor,
    quantity: i.quantity,
  }));
  const subtotal = cartSubtotalMinor(items);
  const country = String(formData.get("country") ?? "IN");
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

  const gatewayOrder = await createGatewayOrder(totals.totalMinor, "INR", `cart_${cart.id.slice(0, 12)}`);
  const intent = await prisma.checkoutIntent.create({
    data: {
      cartId: cart.id,
      cartSnapshot: items.map((i) => ({ ...i, composition: compositionByProduct[i.productId] })) as unknown as Prisma.InputJsonValue,
      email: String(formData.get("email")),
      phone: String(formData.get("phone")),
      shippingAddress: {
        name: String(formData.get("name")),
        line1: String(formData.get("line1")),
        city: String(formData.get("city")),
        state: String(formData.get("state")),
        postalCode: String(formData.get("postalCode")),
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
  redirect(`/checkout/pay/${intent.id}`);
}
