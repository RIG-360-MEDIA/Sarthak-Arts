import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { nextStatusCode, FULFILLMENT_FLOW } from "@/lib/orderflow";
import { Icon } from "../../../_ui/icons";
import { OrderStatusPill } from "../../../_ui/status";
import { advanceStatus, confirmPayment, rejectPayment } from "../actions";

export const dynamic = "force-dynamic";

const NEXT_LABEL: Record<string, string> = { packed: "Mark as packed", shipped: "Mark as shipped", delivered: "Mark as delivered" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true, status: true, certificates: true, payments: true, statusHistory: { include: { status: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const addr = order.shippingAddress as { name: string; line1: string; city: string; state: string; postalCode: string; country: string };
  const next = nextStatusCode(order.status.code, FULFILLMENT_FLOW);
  const doneCodes = new Set(order.statusHistory.map((h) => h.status.code));
  const upi = order.payments.find((p) => p.gateway === "upi");
  const awaitingPayment = order.status.code === "pending_payment";

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <div className="eyebrow"><Link href="/admin/orders" style={{ color: "inherit", textDecoration: "none" }}>← All orders</Link></div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{order.orderNumber} <OrderStatusPill code={order.status.code} name={order.status.name} /></h1>
          <p className="lead">{order.email}{order.phone ? ` · ${order.phone}` : ""}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 24, alignItems: "start" }} className="adm-prod-grid">
        <div style={{ display: "grid", gap: 16 }}>
          {order.isGift && (
            <div className="adm-note brass"><Icon name="gift" /><div><b>Gift order</b> — enclose the message and keep prices out of the parcel.{order.giftNote && <div style={{ marginTop: 6, fontStyle: "italic", whiteSpace: "pre-wrap" }}>&ldquo;{order.giftNote}&rdquo;</div>}</div></div>
          )}

          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">Ship to</span></div>
            <div className="adm-card-pad" style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <b>{addr.name}</b><br />
                {addr.line1}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}
              </div>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">Items</span></div>
            <div className="adm-table-scroll">
              <table className="adm-table">
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}><td className="r-strong">{i.name} <span style={{ color: "var(--ink-faint)" }}>× {i.quantity}</span></td><td className="num right">{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td></tr>
                  ))}
                  <tr><td style={{ color: "var(--ink-muted)" }}>Shipping</td><td className="num right">{formatMoney(order.shippingMinor, order.currency)}</td></tr>
                  <tr><td style={{ color: "var(--ink-muted)" }}>Tax</td><td className="num right">{formatMoney(order.taxMinor, order.currency)}</td></tr>
                  <tr><td className="r-strong">Total</td><td className="num right r-strong">{formatMoney(order.totalMinor, order.currency)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {order.certificates.length > 0 && (
            <div className="adm-card">
              <div className="adm-card-head"><span className="adm-card-title">Certificates</span></div>
              <div className="adm-card-pad" style={{ paddingTop: 14, display: "grid", gap: 8 }}>
                {order.certificates.map((c) => <a key={c.id} href={`/api/admin/certificates/${c.id}`} style={{ fontSize: 13, color: "var(--brass-deep)", textDecoration: "none", fontWeight: 600 }}>↓ {c.storageKey}</a>)}
              </div>
            </div>
          )}
        </div>

        {/* Fulfillment sidebar */}
        <aside style={{ position: "sticky", top: 84, display: "grid", gap: 16 }}>
          {upi && (
            <div className="adm-card adm-card-pad">
              <div className="adm-card-title" style={{ marginBottom: 10 }}>UPI payment</div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                <div>Amount: <b>{formatMoney(upi.amountMinor, upi.currency)}</b></div>
                <div>Transaction ID (UTR): <b style={{ fontFamily: "ui-monospace, monospace" }}>{upi.gatewayPaymentId}</b></div>
                <div>Status: <b>{upi.status === "captured" ? "Received" : upi.status === "failed" ? "Not received" : "Waiting for you to check"}</b></div>
              </div>
              {awaitingPayment && (
                <>
                  <div className="adm-note brass" style={{ marginTop: 12 }}>Check your UPI or bank app for this amount and transaction ID before confirming.</div>
                  <form action={confirmPayment} style={{ marginTop: 12 }}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button type="submit" className="adm-btn adm-btn-primary" style={{ width: "100%" }}><Icon name="check" /> Payment received — confirm order</button>
                  </form>
                  <form action={rejectPayment} style={{ marginTop: 8 }}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button type="submit" className="adm-btn adm-btn-ghost" style={{ width: "100%" }}>Not received — cancel order</button>
                  </form>
                </>
              )}
            </div>
          )}
          {!awaitingPayment && order.status.code !== "cancelled" && (
          <div className="adm-card adm-card-pad">
            <div className="adm-card-title" style={{ marginBottom: 12 }}>Fulfillment</div>
            <div className="adm-timeline">
              {FULFILLMENT_FLOW.map((code) => {
                const done = doneCodes.has(code) || order.status.code === code;
                const label = code.charAt(0).toUpperCase() + code.slice(1);
                return (
                  <div key={code} className={`step${done ? "" : " todo"}`}>
                    <span className="dot">{done ? <Icon name="check" /> : null}</span>{label}
                  </div>
                );
              })}
            </div>
            {next ? (
              <form action={advanceStatus} style={{ marginTop: 14 }}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="currentCode" value={order.status.code} />
                <button type="submit" className="adm-btn adm-btn-primary" style={{ width: "100%" }}><Icon name="check" /> {NEXT_LABEL[next] ?? `Mark as ${next}`}</button>
              </form>
            ) : (
              <div className="adm-note info" style={{ marginTop: 14 }}><Icon name="checkCircle" /> Fulfillment complete.</div>
            )}
            <button className="adm-btn adm-btn-ghost" style={{ width: "100%", marginTop: 8 }} disabled title="Courier integration comes later"><Icon name="truck" /> Generate shipping label</button>
          </div>
          )}
        </aside>
      </div>
    </div>
  );
}
