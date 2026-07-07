"use client";
import { useRouter } from "next/navigation";

declare global {
  interface Window { Razorpay: new (o: object) => { open: () => void } }
}

export function PayButton(props: {
  gatewayOrderId: string; amountMinor: number; currency: string;
  email: string; phone: string; intentId: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: props.gatewayOrderId,
          amount: props.amountMinor,
          currency: props.currency,
          prefill: { email: props.email, contact: props.phone },
          handler: () => router.push(`/checkout/success?intent=${props.intentId}`),
        }).open();
      }}
    >
      Pay now
    </button>
  );
}
