import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../../checkout.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { CheckoutSteps } from "../../CheckoutSteps";
import { PayButton } from "../../PayButton";

export const metadata: Metadata = { title: "Payment — Sarthak Arts" };

export default async function PayPage({ params }: { params: Promise<{ intentId: string }> }) {
  const { intentId } = await params;
  const intent = await prisma.checkoutIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.status !== "pending") notFound();

  return (
    <div className="co-root">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="co-wrap">
        <div className="co-head">
          <div className="eyebrow">Secure checkout</div>
          <h1 className="serif">Payment</h1>
        </div>
        <CheckoutSteps current={3} />

        <div className="co-pay">
          <div className="co-pay-card">
            <div className="co-pay-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h1 className="serif">Ready to pay</h1>
            <p className="sub">Your order is reserved. Complete payment to confirm it.</p>

            <div className="co-pay-amount-lbl">Amount due</div>
            <div className="co-pay-amount">{formatMoney(intent.totalMinor, intent.currency)}</div>

            <PayButton
              gatewayOrderId={intent.gatewayOrderId}
              amountMinor={intent.totalMinor}
              currency={intent.currency}
              email={intent.email}
              phone={intent.phone}
              intentId={intent.id}
            />

            <div className="co-pay-methods">
              <span>UPI</span><span>Cards</span><span>Netbanking</span><span>Wallets</span>
            </div>
            <div className="co-secure" style={{ marginTop: 14 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Payments processed securely by Razorpay
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/checkout" className="co-back">← Back to details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
