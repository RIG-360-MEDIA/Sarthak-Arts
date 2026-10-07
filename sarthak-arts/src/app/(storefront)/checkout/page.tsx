import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./checkout.css";
import { prisma } from "@/lib/db";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { computeTotals, zoneConfigForCountry } from "@/lib/totals";
import { formatMoney } from "@/lib/money";
import { glyphForCategory, gradForMetal, realPhoto } from "@/lib/collection";
import { visualFor } from "@/lib/direction-visual";
import { PieceDefs, PieceRender } from "@/components/collection/Piece";
import { CheckoutSteps } from "./CheckoutSteps";
import { beginCheckout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout — Sarthak Arts" };

const FREE_SHIP_MINOR = 15000 * 100;

const CART_INCLUDE = {
  category: true,
  composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" as const } },
  directions: { include: { direction: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const cartId = (await cookies()).get("cart_id")?.value;
  const cart = cartId ? await getCartWithItems(cartId) : null;
  if (!cart || cart.items.length === 0) redirect("/cart");

  const products = await prisma.product.findMany({ where: { id: { in: cart.items.map((i) => i.productId) } }, include: CART_INCLUDE });
  const byId = new Map(products.map((p) => [p.id, p]));

  const subtotal = cartSubtotalMinor(cart.items.map((i) => ({ unitPriceMinor: i.product.basePriceMinor, quantity: i.quantity })));
  const zone = await zoneConfigForCountry("IN");
  const totals = computeTotals(subtotal, zone);
  const remaining = Math.max(0, FREE_SHIP_MINOR - subtotal);
  const shipPct = Math.min(100, Math.round((subtotal / FREE_SHIP_MINOR) * 100));

  const lines = cart.items.map((i) => {
    const p = byId.get(i.productId);
    const code = p?.directions[0]?.direction.code ?? "center";
    const v = visualFor(code);
    const metal = p?.composition.find((c) => c.metal)?.metal;
    const gem = p?.composition.find((c) => c.gemstone)?.gemstone;
    return {
      id: i.id, name: i.product.name, quantity: i.quantity,
      lineMinor: i.product.basePriceMinor * i.quantity,
      glyph: glyphForCategory(p?.category.code ?? "vessel"),
      metalGrad: gradForMetal(metal?.name), gemHex: gem?.accentHex ?? "#B8863E",
      photoUrl: realPhoto(p?.images[0]?.url),
      dirName: p?.directions[0]?.direction.name ?? "Center", color: v.color, colorDeep: v.colorDeep,
    };
  });

  return (
    <div className="co-root">
      <PieceDefs />
      <div className="co-wrap">
        <div className="co-head">
          <div className="eyebrow">Secure checkout</div>
          <h1 className="serif">Complete your order</h1>
        </div>
        <CheckoutSteps current={2} />

        {error && (
          <div className="co-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" strokeLinecap="round" /></svg>
            {error === "payment"
              ? "We couldn't start the payment just now. Please try again in a moment — your order and details are safe."
              : "Please check your details — some fields need a valid entry (email, phone, and a 6-digit PIN code)."}
          </div>
        )}

        <form action={beginCheckout} className="co-layout">
          {/* Details */}
          <div>
            <section className="co-section">
              <div className="co-section-head"><span className="co-section-num">1</span><h2>Contact</h2></div>
              <div className="co-row">
                <div className="co-field"><label>Email<span className="req">*</span></label><input name="email" type="email" required placeholder="you@email.com" autoComplete="email" /></div>
                <div className="co-field"><label>Phone<span className="req">*</span></label><input name="phone" required placeholder="10-digit mobile" inputMode="tel" autoComplete="tel" /></div>
              </div>
            </section>

            <section className="co-section">
              <div className="co-section-head"><span className="co-section-num">2</span><h2>Shipping address</h2></div>
              <div className="co-field"><label>Full name<span className="req">*</span></label><input name="name" required placeholder="Recipient's full name" autoComplete="name" /></div>
              <div className="co-field"><label>Address<span className="req">*</span></label><input name="line1" required placeholder="House / flat, street, area" autoComplete="address-line1" /></div>
              <div className="co-row-3" style={{ marginTop: 14 }}>
                <div className="co-field" style={{ marginTop: 0 }}><label>City<span className="req">*</span></label><input name="city" required autoComplete="address-level2" /></div>
                <div className="co-field" style={{ marginTop: 0 }}><label>State<span className="req">*</span></label><input name="state" required autoComplete="address-level1" /></div>
                <div className="co-field" style={{ marginTop: 0 }}><label>PIN code<span className="req">*</span></label><input name="postalCode" required inputMode="numeric" autoComplete="postal-code" /></div>
              </div>
              <input type="hidden" name="country" value="IN" />
            </section>

            <section className="co-section">
              <div className="co-section-head"><span className="co-section-num">3</span><h2>Gift options</h2></div>
              <div className="co-gift">
                <label className="co-gift-toggle">
                  <input type="checkbox" name="isGift" />
                  <span className="g-body"><b>This is a gift</b><span>We enclose your message and never print prices in the parcel.</span></span>
                </label>
                <div className="co-field"><label>Gift message (optional)</label><textarea name="giftNote" rows={2} placeholder="A short blessing or note to enclose…" /></div>
              </div>
            </section>

            <Link href="/cart" className="co-back">← Back to cart</Link>
          </div>

          {/* Summary */}
          <aside className="co-summary">
            <h2>Order summary</h2>
            <div className="co-lines">
              {lines.map((it) => (
                <div key={it.id} className="co-line" style={{ ["--pc" as string]: it.color, ["--pc-deep" as string]: it.colorDeep } as React.CSSProperties}>
                  <span className="co-line-thumb">
                    {it.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element -- served already optimised (WebP) by /api/images
                      ? <img src={it.photoUrl} alt="" className="obj" style={{ objectFit: "cover", borderRadius: 10 }} />
                      : <PieceRender glyph={it.glyph} metalGrad={it.metalGrad} gemHex={it.gemHex} className="obj" />}
                    {it.quantity > 1 && <span className="qty">{it.quantity}</span>}
                  </span>
                  <span className="co-line-info">
                    <span className="co-line-name serif">{it.name}</span>
                    <span className="co-line-dir">{it.dirName}</span>
                  </span>
                  <span className="co-line-price">{formatMoney(it.lineMinor, "INR")}</span>
                </div>
              ))}
            </div>

            <div className="co-ship">
              {remaining > 0
                ? <div className="co-ship-text">Add <b>{formatMoney(remaining, "INR")}</b> for free shipping</div>
                : <div className="co-ship-text done">✓ Free shipping unlocked</div>}
              <div className="co-ship-bar"><span className="co-ship-fill" style={{ width: `${shipPct}%` }} /></div>
            </div>

            <div className="co-srow"><span>Subtotal</span><span className="v">{formatMoney(totals.subtotalMinor, "INR")}</span></div>
            <div className="co-srow"><span>Shipping</span><span className="v">{totals.shippingMinor === 0 ? "Free" : formatMoney(totals.shippingMinor, "INR")}</span></div>
            <div className="co-srow"><span>Tax (GST)</span><span className="v">{formatMoney(totals.taxMinor, "INR")}</span></div>
            <div className="co-srow co-stotal"><span>Total</span><span className="v">{formatMoney(totals.totalMinor, "INR")}</span></div>

            <button type="submit" className="co-submit">
              Continue to payment
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <div className="co-secure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Encrypted &amp; secure · your price is locked in
            </div>

            <div className="co-trust">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>Certified metal &amp; gemstone, per piece</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 7l1-2h14l1 2M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" /></svg>Pay by UPI · GPay, PhonePe, Paytm</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>7-day easy returns</span>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
