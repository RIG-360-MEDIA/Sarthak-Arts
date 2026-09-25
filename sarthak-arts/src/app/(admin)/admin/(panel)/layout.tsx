import { redirect } from "next/navigation";
import "../admin.css";
import { prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const [user, openOrders, pendingReturns, pendingReviews, upcomingConsults] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }),
    prisma.order.count({ where: { status: { code: { in: ["confirmed", "packed"] } } } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "requested" } }).catch(() => 0),
    prisma.review.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.booking.count({ where: { status: "booked" } }).catch(() => 0),
  ]);

  const badges: Record<string, number> = {
    "/admin/orders": openOrders,
    "/admin/returns": pendingReturns,
    "/admin/reviews": pendingReviews,
    "/admin/consultations": upcomingConsults,
  };

  return (
    <div className="admin">
      <AdminShell user={{ name: user?.name ?? "", email: user?.email ?? "" }} badges={badges}>
        {children}
      </AdminShell>
    </div>
  );
}
