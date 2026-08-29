import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "../order/order.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Track your order — Sarthak Arts" };

async function goToOrder(formData: FormData): Promise<void> {
  "use server";
  const num = String(formData.get("orderNumber")).trim();
  const email = String(formData.get("email")).trim();
  redirect(`/order/${encodeURIComponent(num)}?email=${encodeURIComponent(email)}`);
}

export default function OrderLookup() {
  return (
    <div className="ot-root">
      <div className="ot-wrap">
        <div className="ot-lookup">
          <div className="ot-lookup-card">
            <div className="ot-lookup-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
            </div>
            <h1 className="serif">Track your order</h1>
            <p className="sub">Enter your order number and the email you used at checkout, and we&apos;ll show you exactly where your piece is.</p>
            <form action={goToOrder}>
              <div className="ot-field">
                <label>Order number</label>
                <input name="orderNumber" placeholder="SA-XXXXXXXX" required autoFocus />
              </div>
              <div className="ot-field">
                <label>Email</label>
                <input name="email" type="email" placeholder="you@email.com" required autoComplete="email" />
              </div>
              <button type="submit" className="ot-btn primary">
                View my order
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
            <p className="foot">Can&apos;t find your order number? It&apos;s in your confirmation email, starting with <b>SA-</b>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
