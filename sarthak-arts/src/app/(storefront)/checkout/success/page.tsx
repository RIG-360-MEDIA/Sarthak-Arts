import type { Metadata } from "next";
import Link from "next/link";
import "../checkout.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { CheckoutSteps } from "../CheckoutSteps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed — Sarthak Arts" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent: intentId } = await searchParams;

  const intent = intentId
    ? await prisma.checkoutIntent.findUnique({ where: { id: intentId } }).catch(() => null)
    : null;
  const order = intent?.gatewayOrderId
    ? await prisma.order.findFirst({ where: { payments: { some: { gatewayOrderId: intent.gatewayOrderId } } }, select: { orderNumber: true, totalMinor: true, currency: true } }).catch(() => null)
    : null;

  const email = intent?.email;
  const amount = order ? formatMoney(order.totalMinor, order.currency) : intent ? formatMoney(intent.totalMinor, intent.currency) : null;

  return (
    <div className="co-root">
      <div className="co-wrap">
        <CheckoutSteps current={4} />

        <div className="co-done">
          <div className="co-done-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 6" /></svg>
          </div>
          <div className="om" aria-hidden="true">ॐ</div>
          <h1 className="serif">Your order is confirmed</h1>
          <p className="lead">
            Thank you{email ? <>, and a confirmation is on its way to <b>{email}</b></> : ""}. Your certificate of
            composition travels with the piece — each one crafted, blessed and sent for the corner it belongs to.
          </p>

          {(order || amount) && (
            <div className="co-done-card" style={{ maxWidth: 420 }}>
              {order && <div className="dl-row"><span className="k">Order number</span><span className="v">{order.orderNumber}</span></div>}
              {amount && <div className="dl-row"><span className="k">Amount paid</span><span className="v">{amount}</span></div>}
              {email && <div className="dl-row"><span className="k">Confirmation to</span><span className="v">{email}</span></div>}
            </div>
          )}

          <div className="co-next" style={{ maxWidth: 460 }}>
            <div className="co-next-item">
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg></span>
              <span><b>Confirmation email</b>Your receipt and order details are in your inbox.</span>
            </div>
            <div className="co-next-item">
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span><b>Crafted &amp; certified</b>We prepare your piece with its certificate of composition.</span>
            </div>
            <div className="co-next-item">
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h11v9H4zM15 10h4l2 3v3h-6z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg></span>
              <span><b>Dispatched with tracking</b>You&apos;ll get a tracking link the moment it ships.</span>
            </div>
          </div>

          <div className="co-done-actions">
            {order
              ? <Link href={`/order/${order.orderNumber}`} className="co-btn primary">Track your order</Link>
              : <Link href="/order-lookup" className="co-btn primary">Track your order</Link>}
            <Link href="/collection" className="co-btn ghost">Continue exploring</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
