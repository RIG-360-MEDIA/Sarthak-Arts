import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { computeTotals, zoneConfigForCountry } from "@/lib/totals";
import { formatMoney } from "@/lib/money";
import { beginCheckout } from "./actions";

export default async function CheckoutPage() {
  const cartId = (await cookies()).get("cart_id")?.value;
  const cart = cartId ? await getCartWithItems(cartId) : null;
  if (!cart || cart.items.length === 0) redirect("/cart");
  const subtotal = cartSubtotalMinor(cart.items.map((i) => ({ unitPriceMinor: i.product.basePriceMinor, quantity: i.quantity })));
  const zone = await zoneConfigForCountry("IN");
  const totals = computeTotals(subtotal, zone);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40, paddingTop: 24 }}>
      <form action={beginCheckout}>
        <h1>Checkout</h1>
        <label>Full name</label><input name="name" required />
        <label>Email</label><input name="email" type="email" required />
        <label>Phone</label><input name="phone" required />
        <label>Address</label><input name="line1" required />
        <label>City</label><input name="city" required />
        <label>State</label><input name="state" required />
        <label>PIN code</label><input name="postalCode" required />
        <input type="hidden" name="country" value="IN" />
        <button style={{ marginTop: 20 }}>Continue to payment</button>
      </form>
      <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 20, height: "fit-content" }}>
        <table>
          <tbody>
            <tr><td>Subtotal</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(totals.subtotalMinor, "INR")}</td></tr>
            <tr><td>Shipping</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(totals.shippingMinor, "INR")}</td></tr>
            <tr><td>Tax</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(totals.taxMinor, "INR")}</td></tr>
            <tr><td className="serif">Total</td><td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{formatMoney(totals.totalMinor, "INR")}</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>The price shown is locked in for your order.</p>
      </div>
    </div>
  );
}
