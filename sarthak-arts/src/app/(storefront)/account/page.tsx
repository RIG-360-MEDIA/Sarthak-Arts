import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import "../order/order.css";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { currentSession } from "@/lib/session";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account — Sarthak Arts" };

export default async function Account() {
  const session = await currentSession();
  if (!session) redirect("/account/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: session.userId }, ...(session.emailVerified ? [{ email: session.email }] : [])] },
    include: { status: true, items: { select: { name: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="ot-root">
      <div className="ot-wrap">
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, margin: "0 0 4px" }}>
          Hello{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p style={{ color: "var(--ink-muted)", margin: "0 0 22px" }}>{session.email}</p>
        {!session.emailVerified && (
          <p role="alert" style={{ color: "var(--sold)" }}>Please confirm your email address to see past orders placed with it.</p>
        )}

        <h2 className="serif" style={{ fontSize: 20, fontWeight: 500 }}>Your orders</h2>
        {orders.length === 0 ? (
          <p style={{ color: "var(--ink-muted)" }}>
            No orders yet. <Link href="/collection" style={{ color: "var(--gold-deep)", fontWeight: 600 }}>Browse the collection</Link>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
            {orders.map((o) => (
              <li key={o.id} className="ot-lookup-card" style={{ padding: 18 }}>
                <Link
                  href={`/order/${encodeURIComponent(o.orderNumber)}?email=${encodeURIComponent(o.email)}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <b>{o.orderNumber}</b> · {o.status.name}
                  <div style={{ color: "var(--ink-muted)", fontSize: 13.5, marginTop: 4 }}>
                    {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {formatMoney(o.totalMinor, o.currency)} · {o.createdAt.toLocaleDateString("en-IN")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <form action={signOut} style={{ marginTop: 24 }}>
          <button type="submit" className="ot-btn ghost sm">Sign out</button>
        </form>
      </div>
    </div>
  );
}
