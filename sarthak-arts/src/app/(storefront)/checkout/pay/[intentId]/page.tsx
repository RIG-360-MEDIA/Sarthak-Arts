import { notFound } from "next/navigation";
import Script from "next/script";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PayButton } from "../../PayButton";

export default async function PayPage({ params }: { params: Promise<{ intentId: string }> }) {
  const { intentId } = await params;
  const intent = await prisma.checkoutIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.status !== "pending") notFound();
  return (
    <div style={{ paddingTop: 40, maxWidth: 420 }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1>Payment</h1>
      <p className="num" style={{ fontSize: 22 }}>{formatMoney(intent.totalMinor, intent.currency)}</p>
      <PayButton
        gatewayOrderId={intent.gatewayOrderId}
        amountMinor={intent.totalMinor}
        currency={intent.currency}
        email={intent.email}
        phone={intent.phone}
        intentId={intent.id}
      />
    </div>
  );
}
