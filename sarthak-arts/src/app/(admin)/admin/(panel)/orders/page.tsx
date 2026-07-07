import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const statuses = await prisma.orderStatus.findMany({ orderBy: { displayOrder: "asc" } });
  const orders = await prisma.order.findMany({
    where: status ? { status: { code: status } } : {},
    include: { status: true },
    orderBy: { createdAt: "desc" },
  });
  const tab = (label: string, code: string | null) => {
    const active = (code ?? undefined) === status || (code === null && !status);
    return (
      <Link
        key={code ?? "all"}
        href={code ? `/admin/orders?status=${code}` : "/admin/orders"}
        style={{ fontSize: 13, padding: "4px 12px", border: "1px solid var(--line)", borderRadius: 20, textDecoration: "none", background: active ? "var(--ink)" : "transparent", color: active ? "var(--ground)" : "var(--ink-muted)" }}
      >
        {label}
      </Link>
    );
  };
  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Orders</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0 16px", flexWrap: "wrap" }}>
        {tab("All", null)}
        {statuses.map((s) => tab(s.name, s.code))}
      </div>
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th /></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>{o.email}</td>
              <td className="num">{formatMoney(o.totalMinor, o.currency)}</td>
              <td>{o.status.name}</td>
              <td><Link href={`/admin/orders/${o.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No orders in this view.</p>}
    </div>
  );
}
