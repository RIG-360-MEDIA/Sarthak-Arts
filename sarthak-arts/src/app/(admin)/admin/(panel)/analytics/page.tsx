import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Icon } from "../../_ui/icons";

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

  const kpis: [string, string, string][] = [
    ["rupee", "Revenue · 30 days", formatMoney(revenue30, "INR")],
    ["orders", "Orders · 30 days", String(orders.length)],
    ["consultations", "Consultations booked", String(bookings)],
    ["reviews", "Reviews", String(reviews)],
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Analytics</h1>
          <p className="lead">How your shop is doing over the last 30 days.</p>
        </div>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: 22 }}>
        {kpis.map(([icon, label, value]) => (
          <div key={label} className="adm-kpi">
            <div className="k-label"><Icon name={icon} /> {label}</div>
            <div className="k-value num">{value}</div>
          </div>
        ))}
      </div>

      <div className="adm-grid adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Top products</span></div>
          {topProducts.length === 0 ? (
            <div className="adm-empty" style={{ padding: "34px 20px" }}><div className="em-ic"><Icon name="analytics" /></div><h3>No sales yet</h3><p>Your best sellers will appear here once orders come in.</p></div>
          ) : (
            <div className="adm-table-scroll"><table className="adm-table"><tbody>
              {topProducts.map(([name, units]) => <tr key={name}><td className="r-strong">{name}</td><td className="num right">{units} sold</td></tr>)}
            </tbody></table></div>
          )}
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-card-title" style={{ marginBottom: 12 }}>Sales by direction</div>
          {byDirection.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No sales yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {byDirection.map(([dir, units]) => {
                const pct = Math.round((units / totalUnits) * 100);
                return (
                  <div key={dir}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span>{dir}</span><span className="num" style={{ color: "var(--ink-muted)" }}>{pct}%</span></div>
                    <div style={{ height: 8, background: "var(--surface-sink)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--gold), var(--brass-deep))", borderRadius: 999 }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
