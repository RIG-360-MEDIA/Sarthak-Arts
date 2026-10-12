import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../../checkout.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { upiLink, upiPayee, upiQrSvg, upiReference } from "@/lib/payments/upi";
import { CheckoutSteps } from "../../CheckoutSteps";
import { PayButton } from "../../PayButton";
import { submitUpi } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment — Sarthak Arts" };

export default async function PayPage({
  params, searchParams,
}: {
  params: Promise<{ intentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { intentId } = await params;
  const { error } = await searchParams;
  const intent = await prisma.checkoutIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.status !== "pending") notFound();

  const isUpi = intent.gatewayCode === "upi";
  const reference = upiReference(intent.id);
  const link = isUpi ? upiLink(intent.totalMinor, reference) : "";
  const qrSvg = isUpi ? await upiQrSvg(link) : "";
  const payee = upiPayee();

  return (
    <div className="co-root">
      {!isUpi && <Script src="https://checkout.razorpay.com/v1/checkout.js" />}
      <div className="co-wrap">
        <div className="co-head">
          <div className="eyebrow">Secure checkout</div>
          <h1 className="serif">Payment</h1>
        </div>
        <CheckoutSteps current={3} />

        <div className="co-pay">
          {isUpi ? (
            <div className="co-pay-card">
              <h1 className="serif">Pay by UPI</h1>
              <p className="sub">Scan with any UPI app — GPay, PhonePe, Paytm or your bank app. The amount is filled in for you.</p>

              <div className="co-pay-amount-lbl">Amount due</div>
              <div className="co-pay-amount">{formatMoney(intent.totalMinor, intent.currency)}</div>

              {/* QR generated server-side from our own UPI link — no user input in it. */}
              <div className="co-upi-qr" aria-label="UPI QR code" dangerouslySetInnerHTML={{ __html: qrSvg }} />

              <a href={link} className="co-submit co-upi-app">Pay with UPI app</a>

              <div className="co-upi-details">
                <div><span>Pay to</span><b>{payee.name}</b></div>
                <div><span>UPI ID</span><b className="mono">{payee.vpa}</b></div>
                <div><span>Reference</span><b className="mono">{reference}</b></div>
              </div>

              <form action={submitUpi} className="co-upi-confirm">
                <input type="hidden" name="intentId" value={intent.id} />
                <div className="co-upi-step">After paying, enter the UPI transaction ID</div>
                {error === "utr" && <div className="co-error">Please enter the 12-digit UPI transaction ID (UTR) shown in your payment app.</div>}
                {error === "dup" && <div className="co-error">That transaction ID has already been used for another order. Please check it and try again.</div>}
                <div className="co-field" suppressHydrationWarning>
                  <label htmlFor="utr">UPI transaction ID (UTR)<span className="req">*</span></label>
                  <input id="utr" name="utr" inputMode="text" autoComplete="off" placeholder="e.g. 412345678901" required minLength={10} maxLength={30} />
                </div>
                <button type="submit" className="co-submit">I have paid — place my order</button>
                <p className="co-upi-note">Your order is reserved. We confirm it as soon as we see the payment, usually within a few hours.</p>
              </form>
            </div>
          ) : (
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
          )}
          <div style={{ textAlign: "center" }}>
            <Link href="/checkout" className="co-back">← Back to details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
