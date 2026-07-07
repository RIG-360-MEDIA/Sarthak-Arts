import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Dashboard() {
  const threshold = await getSetting<number>("low_stock_threshold", 5);
  const since = startOfToday();
  const [todayOrders, lowStock, recent] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since } } }),
    prisma.product.findMany({ where: { stockQuantity: { lte: threshold }, status: "live" }, orderBy: { stockQuantity: "asc" } }),
    prisma.order.findMany({ include: { status: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const revenueToday = todayOrders.reduce((s, o) => s + o.totalMinor, 0);

  const card = (label: string, value: string, sub?: string) => (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div className="serif" style={{ fontSize: 24, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, marginTop: 4, color: "var(--ink-muted)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Good morning</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "16px 0 22px" }}>
        {card("Revenue, today", formatMoney(revenueToday, "INR"))}
        {card("Orders, today", String(todayOrders.length))}
        {card("Low stock", `${lowStock.length} item(s)`, `at or below ${threshold}`)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Recent orders</div>
          {recent.length === 0 && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>No orders yet.</p>}
          {recent.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
              <span className="num">{formatMoney(o.totalMinor, o.currency)}</span>
              <span style={{ color: "var(--ink-muted)" }}>{o.status.name}</span>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--brass)", fontWeight: 600, marginBottom: 8 }}>Low stock</div>
          {lowStock.length === 0 && <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>All stocked.</p>}
          {lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
              <span className="num" style={{ color: p.stockQuantity === 0 ? "var(--critical)" : "var(--ink)" }}>{p.stockQuantity} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
