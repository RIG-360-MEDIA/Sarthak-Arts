"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window { Razorpay: new (o: object) => { open: () => void } }
}

export function PayButton(props: {
  gatewayOrderId: string; amountMinor: number; currency: string;
  email: string; phone: string; intentId: string;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const pay = () => {
    setOpening(true);
    try {
      new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: props.gatewayOrderId,
        amount: props.amountMinor,
        currency: props.currency,
        prefill: { email: props.email, contact: props.phone },
        handler: () => router.push(`/checkout/success?intent=${props.intentId}`),
        modal: { ondismiss: () => setOpening(false) },
      }).open();
    } catch {
      setOpening(false);
    }
  };

  return (
    <button className="co-submit" onClick={pay} disabled={opening}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      {opening ? "Opening secure payment…" : "Pay securely"}
    </button>
  );
}
