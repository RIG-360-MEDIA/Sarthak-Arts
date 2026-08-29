import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Icon } from "../../_ui/icons";
import { OrderStatusPill } from "../../_ui/status";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
}

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q = "" } = await searchParams;
  const statuses = await prisma.orderStatus.findMany({ orderBy: { displayOrder: "asc" } });
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: { code: status } } : {}),
      ...(q ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { status: true },
    orderBy: { createdAt: "desc" },
  });

  const chipHref = (code: string | null) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (code) p.set("status", code);
    const qs = p.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Orders</h1>
          <p className="lead">{orders.length} order{orders.length === 1 ? "" : "s"}{status ? " in this view" : ""}.</p>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-tools">
          <form className="adm-search" method="get">
            <Icon name="search" />
            <input name="q" defaultValue={q} placeholder="Search by order number or email…" aria-label="Search orders" />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
          <div className="adm-chips">
            <Link href={chipHref(null)} className={`adm-chip${!status ? " is-active" : ""}`}>All</Link>
            {statuses.map((s) => (
              <Link key={s.code} href={chipHref(s.code)} className={`adm-chip${status === s.code ? " is-active" : ""}`}>{s.name}</Link>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="adm-empty">
            <div className="em-ic"><Icon name="orders" /></div>
            <h3>{q || status ? "No orders match" : "No orders yet"}</h3>
            <p>{q || status ? "Try a different search or filter." : "When a customer places an order, it will appear here ready to fulfil."}</p>
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Date</th><th className="right">Total</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="r-strong">{o.orderNumber}</Link></td>
                    <td>{o.email}</td>
                    <td style={{ color: "var(--ink-muted)" }}>{fmtDate(o.createdAt)}</td>
                    <td className="num right">{formatMoney(o.totalMinor, o.currency)}</td>
                    <td><OrderStatusPill code={o.status.code} name={o.status.name} /></td>
                    <td className="right"><Link href={`/admin/orders/${o.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
