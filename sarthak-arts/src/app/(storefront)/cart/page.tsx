import Link from "next/link";
import { cookies } from "next/headers";
import { getCartWithItems, cartSubtotalMinor } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { updateQuantity } from "./actions";

export default async function CartPage() {
  const cartId = (await cookies()).get("cart_id")?.value;
  const cart = cartId ? await getCartWithItems(cartId) : null;
  const items = cart?.items ?? [];
  const subtotal = cartSubtotalMinor(items.map((i) => ({ unitPriceMinor: i.product.basePriceMinor, quantity: i.quantity })));

  if (items.length === 0)
    return (
      <p style={{ paddingTop: 40 }}>
        Your cart is empty. <Link href="/">Browse the collection</Link>.
      </p>
    );

  return (
    <div style={{ paddingTop: 24, maxWidth: 640 }}>
      <h1>Your cart</h1>
      <table>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.product.name}</td>
              <td>
                <form action={updateQuantity} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="hidden" name="productId" value={i.productId} />
                  <input name="quantity" type="number" defaultValue={i.quantity} min={0} style={{ width: 64 }} />
                  <button className="btn-ghost" style={{ padding: "6px 12px" }}>Update</button>
                </form>
              </td>
              <td className="num" style={{ textAlign: "right" }}>{formatMoney(i.product.basePriceMinor * i.quantity, "INR")}</td>
            </tr>
          ))}
          <tr>
            <td className="serif" style={{ fontSize: 16 }}>Subtotal</td>
            <td />
            <td className="num" style={{ textAlign: "right", fontSize: 16 }}>{formatMoney(subtotal, "INR")}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 16 }}>
        <Link href="/checkout"><button>Checkout</button></Link>
      </p>
    </div>
  );
}
