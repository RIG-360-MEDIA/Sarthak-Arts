import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true, status: true, certificates: true, payments: true },
  });
  if (!order) notFound();
  const addr = order.shippingAddress as {
    name: string; line1: string; city: string; state: string; postalCode: string; country: string;
  };
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1>{order.orderNumber} — {order.status.name}</h1>
      <p style={{ color: "var(--ink-muted)" }}>{order.email} · {order.phone}</p>
      <p style={{ fontSize: 14 }}>
        {addr.name}, {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
      </p>
      <table>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}>
              <td>{i.name} × {i.quantity}</td>
              <td className="num" style={{ textAlign: "right" }}>{formatMoney(i.unitPriceMinor * i.quantity, order.currency)}</td>
            </tr>
          ))}
          <tr>
            <td><strong>Total</strong></td>
            <td className="num" style={{ textAlign: "right" }}><strong>{formatMoney(order.totalMinor, order.currency)}</strong></td>
          </tr>
        </tbody>
      </table>
      <h3>Certificates</h3>
      <ul>
        {order.certificates.map((c) => (
          <li key={c.id}><a href={`/api/admin/certificates/${c.id}`}>{c.storageKey}</a></li>
        ))}
      </ul>
    </div>
  );
}
