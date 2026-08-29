import type { Metadata } from "next";
import Link from "next/link";
import "../order.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { canReturn } from "@/lib/returns";
import { glyphForCategory, gradForMetal } from "@/lib/collection";
import { visualFor } from "@/lib/direction-visual";
import { PieceDefs, PieceRender } from "@/components/collection/Piece";
import { OrderTimeline } from "../OrderTimeline";
import { submitReview, requestReturn } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order — Sarthak Arts" };

const PILL: Record<string, "ok" | "info" | "warn" | "crit" | "neutral"> = {
  pending: "warn", paid: "info", confirmed: "info", packed: "info", shipped: "info",
  delivered: "ok", cancelled: "crit", refunded: "neutral",
};

function Stars({ n }: { n: number }) {
  return <span aria-hidden="true" style={{ color: "var(--gold)", letterSpacing: 1 }}>{"★".repeat(n)}<span style={{ color: "var(--line)" }}>{"★".repeat(5 - n)}</span></span>;
}

export default async function OrderView({
  params, searchParams,
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
      statusHistory: { include: { status: true }, orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { include: { category: true, directions: { include: { direction: true } }, composition: { include: { metal: true, gemstone: true } } } },
          review: true,
          returnRequest: { include: { reason: true } },
        },
      },
    },
  });

  if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
    return (
      <div className="ot-root">
        <div className="ot-wrap">
          <div className="ot-empty">
            <div className="om" aria-hidden="true">ॐ</div>
            <h1 className="serif">We couldn&apos;t find that order</h1>
            <p>Please double-check the order number and the email you used at checkout — they need to match exactly.</p>
            <Link href="/order-lookup" className="ot-btn primary">Try again</Link>
          </div>
        </div>
      </div>
    );
  }

  const windowDays = await getSetting<number>("return_window_days", 7);
  const reasons = await prisma.returnReason.findMany({ where: { active: true } });
  const deliveredAt = order.statusHistory.find((h) => h.status.code === "delivered")?.createdAt ?? null;
  const now = new Date();

  const dates: Record<string, Date | undefined> = {};
  for (const h of order.statusHistory) dates[h.status.code] = h.createdAt;

  const placed = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(order.createdAt);
  const isClosed = order.status.code === "cancelled" || order.status.code === "refunded";
  const preShip = ["confirmed", "packed"].includes(order.status.code);
  const addr = order.shippingAddress as { name: string; line1: string; city: string; state: string; postalCode: string; country: string };

  return (
    <div className="ot-root">
      <PieceDefs />
      <div className="ot-wrap">
        <Link href="/order-lookup" className="ot-back" style={{ marginBottom: 14 }}>← Track a different order</Link>

        <div className="ot-head">
          <div className="eyebrow">Your order</div>
          <h1 className="serif">{order.orderNumber} <span className={`ot-pill ${PILL[order.status.code] ?? "neutral"}`}>{order.status.name}</span></h1>
          <div className="meta">Placed on {placed}</div>
        </div>

        {order.isGift && (
          <div className="ot-banner gift">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="9" width="17" height="4" rx="1" /><path d="M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 9v12" /><path d="M12 9S10.5 4.5 8 4.5A2.2 2.2 0 0 0 8 9h4Zm0 0s1.5-4.5 4-4.5A2.2 2.2 0 0 1 16 9h-4Z" /></svg>
            <div><b>Sent as a gift</b> — no prices are shown in the parcel.{order.giftNote && <div className="note">&ldquo;{order.giftNote}&rdquo;</div>}</div>
          </div>
        )}

        {/* Tracking */}
        <div className="ot-card">
          <div className="ot-card-title">Order status</div>
          {isClosed ? (
            <div className={`ot-banner ${order.status.code === "cancelled" ? "crit" : "gift"}`} style={{ marginBottom: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16v.5" /></svg>
              <div><b>This order was {order.status.name.toLowerCase()}.</b><div className="note" style={{ fontStyle: "normal", color: "var(--ink-muted)" }}>If you have any questions, reply to your confirmation email and we&apos;ll help.</div></div>
            </div>
          ) : (
            <>
              <OrderTimeline currentCode={order.status.code} dates={dates} />
              {preShip && <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 14, marginBottom: 0 }}>We&apos;ll email you a tracking link the moment your piece ships.</p>}
            </>
          )}
        </div>

        {/* Items */}
        <div className="ot-card">
          <div className="ot-card-title">Your pieces</div>
          {order.items.map((item) => {
            const p = item.product;
            const dirCode = p?.directions[0]?.direction.code ?? "center";
            const v = visualFor(dirCode);
            const metal = p?.composition.find((c) => c.metal)?.metal;
            const gem = p?.composition.find((c) => c.gemstone)?.gemstone;
            const returnable = canReturn({
              statusCode: order.status.code, deliveredAt, windowDays, now,
              isFinalSale: p.isFinalSale, alreadyRequested: !!item.returnRequest,
            });
            return (
              <div key={item.id} className="ot-item" style={{ ["--pc" as string]: v.color } as React.CSSProperties}>
                <span className="ot-item-thumb">
                  <PieceRender glyph={glyphForCategory(p?.category.code ?? "vessel")} metalGrad={gradForMetal(metal?.name)} gemHex={gem?.accentHex ?? "#B8863E"} className="obj" />
                </span>
                <div className="ot-item-main">
                  <div className="ot-item-top">
                    <div><span className="ot-item-name serif">{item.name}</span> <span className="ot-item-qty">× {item.quantity}</span></div>
                    <div className="ot-item-price">{formatMoney(item.unitPriceMinor * item.quantity, order.currency)}</div>
                  </div>

                  {/* Review */}
                  {order.status.code === "delivered" && !item.review && (
                    <form action={submitReview} className="ot-form">
                      <input type="hidden" name="orderItemId" value={item.id} />
                      <div className="ot-form-title">Share your experience</div>
                      <div className="ot-form-sub">Delivered pieces can be reviewed — it helps other seekers.</div>
                      <div className="ot-form-row">
                        <div><label className="ot-field" style={{ margin: 0 }}>Your name</label><input name="name" required /></div>
                        <div><label className="ot-field" style={{ margin: 0 }}>Rating</label><select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}</select></div>
                      </div>
                      <div style={{ marginTop: 10 }}><label className="ot-field" style={{ margin: 0 }}>Your review</label><textarea name="body" rows={2} required placeholder="What does this piece mean in your home?" /></div>
                      <button type="submit" className="ot-btn ghost sm">Submit review</button>
                    </form>
                  )}
                  {item.review && <div className="ot-item-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 6" /></svg>You reviewed this — <Stars n={item.review.rating} /></div>}

                  {/* Return */}
                  {item.returnRequest ? (
                    <div className="ot-item-note" style={{ color: "var(--ink-muted)" }}>Return {item.returnRequest.status} — {item.returnRequest.reason.displayName}</div>
                  ) : returnable ? (
                    <form action={requestReturn} className="ot-form">
                      <input type="hidden" name="orderItemId" value={item.id} />
                      <div className="ot-form-title">Request a return</div>
                      <div className="ot-form-sub">Within {windowDays} days of delivery.</div>
                      <div className="ot-form-row">
                        <div><label className="ot-field" style={{ margin: 0 }}>Reason</label><select name="reasonId">{reasons.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}</select></div>
                        <div><label className="ot-field" style={{ margin: 0 }}>Note (optional)</label><input name="note" /></div>
                      </div>
                      <button type="submit" className="ot-btn ghost sm">Request return</button>
                    </form>
                  ) : order.status.code === "delivered" && p.isFinalSale ? (
                    <div className="ot-item-note" style={{ color: "var(--ink-faint)" }}>This piece is final sale — not returnable.</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary + address */}
        <div className="ot-card">
          <div className="ot-card-title">Order summary</div>
          <div className="ot-dl" style={{ marginBottom: 18 }}>
            <div className="row"><span className="k">Subtotal</span><span className="v">{formatMoney(order.subtotalMinor, order.currency)}</span></div>
            <div className="row"><span className="k">Shipping</span><span className="v">{order.shippingMinor === 0 ? "Free" : formatMoney(order.shippingMinor, order.currency)}</span></div>
            <div className="row"><span className="k">Tax (GST)</span><span className="v">{formatMoney(order.taxMinor, order.currency)}</span></div>
            <div className="row total"><span className="k">Total</span><span className="v">{formatMoney(order.totalMinor, order.currency)}</span></div>
          </div>
          <div className="ot-card-title">Delivering to</div>
          <div className="ot-addr">
            <b>{addr.name}</b><br />
            {addr.line1}<br />
            {addr.city}, {addr.state} {addr.postalCode}<br />
            {addr.country}
          </div>
        </div>
      </div>
    </div>
  );
}
