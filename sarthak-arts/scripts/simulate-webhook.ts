import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const intent = await db.checkoutIntent.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!intent) throw new Error("No pending checkout intent — go through checkout first.");
  const body = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: `pay_sim_${Date.now()}`, order_id: intent.gatewayOrderId } } },
  });
  const sig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "whsec_local_dev")
    .update(body)
    .digest("hex");
  const res = await fetch("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": sig },
    body,
  });
  console.log(res.status, await res.text());
}
main().finally(() => db.$disconnect());
