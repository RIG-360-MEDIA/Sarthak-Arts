import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { resolveReturn } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReturns() {
  const requests = await prisma.returnRequest.findMany({
    include: { reason: true, orderItem: { include: { order: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return (
    <div style={{ padding: "22px 26px" }}>
      <h1>Return requests</h1>
      {requests.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No return requests.</p>}
      <table>
        <thead><tr><th>Order</th><th>Item</th><th>Reason</th><th>Status</th><th /></tr></thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.orderItem.order.orderNumber}<div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{r.orderItem.order.email}</div></td>
              <td>{r.orderItem.name}<div className="num" style={{ fontSize: 12 }}>{formatMoney(r.orderItem.unitPriceMinor, r.orderItem.order.currency)}</div></td>
              <td>{r.reason.displayName}{r.customerNote ? <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{r.customerNote}</div> : null}</td>
              <td>{r.status}</td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  {r.status === "requested" && <>
                    <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="approved" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Approve</button></form>
                    <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Reject</button></form>
                  </>}
                  {r.status === "approved" && <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="refunded" /><button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Mark refunded</button></form>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Refund money movement reuses the payment gateway once its keys are configured; status is tracked through to refunded here.</p>
    </div>
  );
}
