import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { completeIntent } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature, process.env.RAZORPAY_WEBHOOK_SECRET!))
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const event = JSON.parse(raw);
  if (event.event === "payment.captured") {
    const p = event.payload.payment.entity;
    await completeIntent(p.order_id, p.id);
  }
  return NextResponse.json({ ok: true });
}
