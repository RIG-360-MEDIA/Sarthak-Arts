import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function goToOrder(formData: FormData): Promise<void> {
  "use server";
  const num = String(formData.get("orderNumber")).trim();
  const email = String(formData.get("email")).trim();
  redirect(`/order/${encodeURIComponent(num)}?email=${encodeURIComponent(email)}`);
}

export default function OrderLookup() {
  return (
    <div style={{ paddingTop: 24, maxWidth: 420 }}>
      <h1>Find your order</h1>
      <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Enter your order number and the email you used to check out.</p>
      <form action={goToOrder}>
        <label>Order number</label><input name="orderNumber" placeholder="SA-…" required />
        <label>Email</label><input name="email" type="email" required />
        <button style={{ marginTop: 14 }}>View order</button>
      </form>
    </div>
  );
}
