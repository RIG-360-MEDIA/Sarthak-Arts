import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSetting } from "@/lib/settings";
import { currentSession } from "@/lib/session";
import { Icon } from "../_ui/icons";
import { OrderStatusPill, StockPill } from "../_ui/status";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function istParts() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now));
  const date = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return { greeting, date };
}

type Attn = { tone: "warn" | "crit" | "info" | "ok"; icon: string; title: string; sub: string; href: string };

export default async function Dashboard() {
  const threshold = await getSetting<number>("low_stock_threshold", 5);
  const since = startOfToday();
  const session = await currentSession();

  const [user, todayOrders, lowStock, recent, openOrders, pendingReturns, upcomingConsults, pendingReviews] = await Promise.all([
    session ? prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }) : null,
    prisma.order.findMany({ where: { createdAt: { gte: since } } }),
    prisma.product.findMany({ where: { stockQuantity: { lte: threshold }, status: "live" }, orderBy: { stockQuantity: "asc" } }),
    prisma.order.findMany({ include: { status: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.order.count({ where: { status: { code: { in: ["confirmed", "packed"] } } } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "requested" } }).catch(() => 0),
    prisma.booking.count({ where: { status: "booked" } }).catch(() => 0),
    prisma.review.count({ where: { status: "pending" } }).catch(() => 0),
  ]);

  const revenueToday = todayOrders.reduce((s, o) => s + o.totalMinor, 0);
  const { greeting, date } = istParts();
  const firstName = (user?.name ?? "").split(" ")[0];
  const outOfStock = lowStock.filter((p) => p.stockQuantity === 0).length;

  const attn: Attn[] = [];
  if (openOrders > 0) attn.push({ tone: "info", icon: "orders", href: "/admin/orders", title: `${openOrders} order${openOrders === 1 ? "" : "s"} to fulfil`, sub: "Confirmed or packed — waiting on you to move them forward." });
  if (lowStock.length > 0) attn.push({ tone: outOfStock > 0 ? "crit" : "warn", icon: "box", href: "/admin/products", title: outOfStock > 0 ? `${outOfStock} piece${outOfStock === 1 ? "" : "s"} out of stock` : `${lowStock.length} piece${lowStock.length === 1 ? "" : "s"} running low`, sub: `At or below ${threshold} in stock — restock or hide before it sells out.` });
  if (pendingReturns > 0) attn.push({ tone: "warn", icon: "returns", href: "/admin/returns", title: `${pendingReturns} return${pendingReturns === 1 ? "" : "s"} to review`, sub: "A customer is waiting for you to approve or decline." });
  if (upcomingConsults > 0) attn.push({ tone: "info", icon: "consultations", href: "/admin/consultations", title: `${upcomingConsults} consultation${upcomingConsults === 1 ? "" : "s"} booked`, sub: "Upcoming Vāstu sessions — check the schedule." });
  if (pendingReviews > 0) attn.push({ tone: "warn", icon: "reviews", href: "/admin/reviews", title: `${pendingReviews} review${pendingReviews === 1 ? "" : "s"} to approve`, sub: "New customer reviews are waiting to go live." });

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <div className="eyebrow">{date}</div>
          <h1>{greeting}{firstName ? `, ${firstName}` : ""}</h1>
          <p className="lead">Here&apos;s what&apos;s happening in your shop today.</p>
        </div>
        <Link href="/admin/products/new" className="adm-btn adm-btn-primary"><Icon name="plus" /> Add a product</Link>
      </div>

      {/* KPI row */}
      <div className="adm-grid adm-grid-3" style={{ marginBottom: 22 }}>
        <div className="adm-kpi">
          <div className="k-label"><Icon name="rupee" /> Revenue today</div>
          <div className="k-value num">{formatMoney(revenueToday, "INR")}</div>
          <div className="k-sub">{todayOrders.length} order{todayOrders.length === 1 ? "" : "s"} placed</div>
        </div>
        <div className="adm-kpi">
          <div className="k-label"><Icon name="orders" /> Orders today</div>
          <div className="k-value num">{todayOrders.length}</div>
          <div className="k-sub">Since midnight (IST)</div>
        </div>
        <div className={`adm-kpi${lowStock.length > 0 ? " alert" : ""}`}>
          <div className="k-label"><Icon name="box" /> Low stock</div>
          <div className="k-value num">{lowStock.length}</div>
          <div className="k-sub">At or below {threshold} in stock</div>
        </div>
      </div>

      {/* Needs your attention */}
      <div className="adm-subhead">Needs your attention</div>
      {attn.length > 0 ? (
        <div className="adm-attn" style={{ marginBottom: 26 }}>
          {attn.map((a) => (
            <Link key={a.title} href={a.href} className="adm-attn-item">
              <span className={`adm-attn-ic ${a.tone}`}><Icon name={a.icon} /></span>
              <span className="adm-attn-body"><b>{a.title}</b><span>{a.sub}</span></span>
              <span className="chev"><Icon name="chevron" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="adm-allclear" style={{ marginBottom: 26 }}>
          <Icon name="checkCircle" /> You&apos;re all caught up — nothing needs your attention right now.
        </div>
      )}

      {/* Two columns: recent orders + low stock list */}
      <div className="adm-grid adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Recent orders</span><Link href="/admin/orders" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--brass-deep)", textDecoration: "none" }}>View all →</Link></div>
          {recent.length === 0 ? (
            <div className="adm-empty" style={{ padding: "34px 20px" }}>
              <div className="em-ic"><Icon name="orders" /></div>
              <h3>No orders yet</h3>
              <p>When a customer buys a piece, it will appear here.</p>
            </div>
          ) : (
            <div className="adm-table-scroll">
              <table className="adm-table">
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link><div className="r-sub">{o.email}</div></td>
                      <td className="num right">{formatMoney(o.totalMinor, o.currency)}</td>
                      <td className="right"><OrderStatusPill code={o.status.code} name={o.status.name} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Low stock</span><Link href="/admin/products" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--brass-deep)", textDecoration: "none" }}>Manage →</Link></div>
          {lowStock.length === 0 ? (
            <div className="adm-empty" style={{ padding: "34px 20px" }}>
              <div className="em-ic"><Icon name="checkCircle" /></div>
              <h3>Everything&apos;s stocked</h3>
              <p>No live pieces are running low. Nicely done.</p>
            </div>
          ) : (
            <div className="adm-table-scroll">
              <table className="adm-table">
                <tbody>
                  {lowStock.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                      <td className="right"><StockPill qty={p.stockQuantity} low /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
