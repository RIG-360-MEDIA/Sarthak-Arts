import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { nextStatusCode, FULFILLMENT_FLOW } from "@/lib/orderflow";
import { advanceStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true, status: true, certificates: true, payments: true, statusHistory: { include: { status: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const addr = order.shippingAddress as { name: string; line1: string; city: string; state: string; postalCode: string; country: string };
  const next = nextStatusCode(order.status.code, FULFILLMENT_FLOW);

  return (
    <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
      <div>
        <h1>{order.orderNumber} — {order.status.name}</h1>
        <p style={{ color: "var(--ink-muted)" }}>{order.email} · {order.phone}</p>
        <p style={{ fontSize: 14 }}>{addr.name}, {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}</p>
        {order.isGift && (
          <div style={{ border: "1px solid var(--brass)", background: "var(--ground-raised)", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--brass)" }}>🎁 Gift order — enclose the message, no prices in the parcel</div>
            {order.giftNote && <p style={{ fontSize: 14, marginTop: 6, whiteSpace: "pre-wrap" }}>“{order.giftNote}”</p>}
          </div>
        )}
        <table style={{ marginTop: 12 }}>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}><td>{i.name} × {i.quantity}</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td></tr>
            ))}
            <tr><td>Shipping</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(order.shippingMinor, order.currency)}</td></tr>
            <tr><td>Tax</td><td className="num" style={{ textAlign: "right" }}>{formatMoney(order.taxMinor, order.currency)}</td></tr>
            <tr><td><strong>Total</strong></td><td className="num" style={{ textAlign: "right" }}><strong>{formatMoney(order.totalMinor, order.currency)}</strong></td></tr>
          </tbody>
        </table>
        <h3 style={{ marginTop: 20 }}>Certificates</h3>
        <ul>{order.certificates.map((c) => <li key={c.id}><a href={`/api/admin/certificates/${c.id}`}>{c.storageKey}</a></li>)}</ul>
      </div>
      <aside style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16, height: "fit-content" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Fulfillment</div>
        {order.statusHistory.map((h) => (
          <div key={h.id} style={{ fontSize: 13, padding: "4px 0", color: "var(--ink)" }}>✓ {h.status.name}</div>
        ))}
        {next ? (
          <form action={advanceStatus} style={{ marginTop: 10 }}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="currentCode" value={order.status.code} />
            <button style={{ width: "100%" }}>Mark as {next}</button>
          </form>
        ) : (
          <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 10 }}>Fulfillment complete.</p>
        )}
        <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} disabled title="Courier integration comes in a later plan">Generate shipping label</button>
      </aside>
    </div>
  );
}
