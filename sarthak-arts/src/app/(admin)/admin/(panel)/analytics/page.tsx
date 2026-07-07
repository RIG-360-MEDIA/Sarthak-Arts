import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Analytics() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [orders, items, bookings, reviews] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since } } }),
    prisma.orderItem.findMany({ include: { product: { include: { directions: { include: { direction: true } } } } } }),
    prisma.booking.count(),
    prisma.review.count(),
  ]);
  const revenue30 = orders.reduce((s, o) => s + o.totalMinor, 0);

  const unitsByProduct = new Map<string, number>();
  const unitsByDirection = new Map<string, number>();
  for (const it of items) {
    unitsByProduct.set(it.name, (unitsByProduct.get(it.name) ?? 0) + it.quantity);
    const dir = it.product?.directions[0]?.direction.name ?? "Unassigned";
    unitsByDirection.set(dir, (unitsByDirection.get(dir) ?? 0) + it.quantity);
  }
  const topProducts = [...unitsByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const byDirection = [...unitsByDirection.entries()].sort((a, b) => b[1] - a[1]);
  const totalUnits = [...unitsByDirection.values()].reduce((a, b) => a + b, 0) || 1;

  const card = (label: string, value: string) => (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase" }}>{label}</div>
      <div className="serif" style={{ fontSize: 22, marginTop: 6 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "16px 0 22px" }}>
        {card("Revenue, 30 days", formatMoney(revenue30, "INR"))}
        {card("Orders, 30 days", String(orders.length))}
        {card("Consultations booked", String(bookings))}
        {card("Reviews", String(reviews))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Top products</div>
          {topProducts.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>No sales yet.</p>}
          {topProducts.map(([name, units]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}><span>{name}</span><span className="num">{units} sold</span></div>
          ))}
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Sales by direction</div>
          {byDirection.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>No sales yet.</p>}
          {byDirection.map(([dir, units]) => (
            <div key={dir} style={{ padding: "5px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{dir}</span><span className="num">{Math.round((units / totalUnits) * 100)}%</span></div>
              <div style={{ height: 4, background: "var(--ground-raised)", borderRadius: 2, marginTop: 3 }}><div style={{ width: `${(units / totalUnits) * 100}%`, height: 4, background: "var(--brass)", borderRadius: 2 }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
