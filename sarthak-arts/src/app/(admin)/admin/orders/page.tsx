import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({ include: { status: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1>Orders</h1>
      {orders.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No orders yet.</p>}
      <table>
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th /></tr>
        </thead>
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
    </div>
  );
}
