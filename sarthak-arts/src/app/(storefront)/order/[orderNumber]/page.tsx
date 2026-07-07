import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { canReturn } from "@/lib/returns";
import { submitReview, requestReturn } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrderView({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const { email = "" } = await searchParams;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      status: true,
      statusHistory: { include: { status: true } },
      items: {
        include: {
          product: true,
          review: true,
          returnRequest: { include: { reason: true } },
        },
      },
    },
  });

  if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
    return (
      <div style={{ paddingTop: 40, maxWidth: 420 }}>
        <h1>Order not found</h1>
        <p style={{ color: "var(--ink-muted)" }}>Check the order number and email. <Link href="/order-lookup">Try again</Link>.</p>
      </div>
    );
  }

  const windowDays = await getSetting<number>("return_window_days", 7);
  const reasons = await prisma.returnReason.findMany({ where: { active: true } });
  const deliveredAt = order.statusHistory.find((h) => h.status.code === "delivered")?.createdAt ?? null;
  const now = new Date();

  return (
    <div style={{ paddingTop: 24, maxWidth: 720 }}>
      <h1>{order.orderNumber}</h1>
      <p style={{ color: "var(--ink-muted)" }}>Status: {order.status.name}</p>

      {order.items.map((item) => {
        const returnable = canReturn({
          statusCode: order.status.code,
          deliveredAt,
          windowDays,
          now,
          isFinalSale: item.product.isFinalSale,
          alreadyRequested: !!item.returnRequest,
        });
        return (
          <div key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="serif" style={{ fontSize: 16 }}>{item.name} × {item.quantity}</div>
              <div className="num">{formatMoney(item.unitPriceMinor * item.quantity, order.currency)}</div>
            </div>

            {order.status.code === "delivered" && !item.review && (
              <form action={submitReview} style={{ marginTop: 10, padding: 12, background: "var(--ground-raised)", borderRadius: 8 }}>
                <input type="hidden" name="orderItemId" value={item.id} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>Leave a review</div>
                <label>Your name</label><input name="name" required />
                <label>Rating</label>
                <select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}</select>
                <label>Review</label><textarea name="body" rows={2} required />
                <button className="btn-ghost" style={{ marginTop: 8 }}>Submit review</button>
              </form>
            )}
            {item.review && <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>✓ You reviewed this ({item.review.rating}★).</p>}

            {item.returnRequest ? (
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
                Return {item.returnRequest.status} — {item.returnRequest.reason.displayName}
              </p>
            ) : returnable ? (
              <form action={requestReturn} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
                <input type="hidden" name="orderItemId" value={item.id} />
                <div><label>Return reason</label><select name="reasonId">{reasons.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}</select></div>
                <div><label>Note (optional)</label><input name="note" /></div>
                <button className="btn-ghost">Request return</button>
              </form>
            ) : order.status.code === "delivered" && item.product.isFinalSale ? (
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 8 }}>This piece is final sale — not returnable.</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
