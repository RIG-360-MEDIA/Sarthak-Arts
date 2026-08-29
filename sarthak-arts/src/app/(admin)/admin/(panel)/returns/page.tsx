import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Icon } from "../../_ui/icons";
import { ReturnStatusPill } from "../../_ui/status";
import { resolveReturn } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReturns() {
  const requests = await prisma.returnRequest.findMany({
    include: { reason: true, orderItem: { include: { order: true } } },
    orderBy: { requestedAt: "desc" },
  });
  const pending = requests.filter((r) => r.status === "requested").length;

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Returns</h1>
          <p className="lead">{pending > 0 ? `${pending} waiting for your decision.` : "Nothing awaiting a decision right now."}</p>
        </div>
      </div>

      <div className="adm-table-wrap">
        {requests.length === 0 ? (
          <div className="adm-empty">
            <div className="em-ic"><Icon name="returns" /></div>
            <h3>No return requests</h3>
            <p>If a customer requests a return, it will show up here for you to approve, decline, or mark refunded.</p>
          </div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead><tr><th>Order</th><th>Item</th><th>Reason</th><th>Status</th><th className="right">Action</th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><span className="r-strong">{r.orderItem.order.orderNumber}</span><div className="r-sub">{r.orderItem.order.email}</div></td>
                    <td>{r.orderItem.name}<div className="r-sub num">{formatMoney(r.orderItem.unitPriceMinor, r.orderItem.order.currency)}</div></td>
                    <td>{r.reason.displayName}{r.customerNote ? <div className="r-sub">&ldquo;{r.customerNote}&rdquo;</div> : null}</td>
                    <td><ReturnStatusPill status={r.status} /></td>
                    <td className="right">
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                        {r.status === "requested" && <>
                          <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="approved" /><button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">Approve</button></form>
                          <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="adm-btn adm-btn-danger adm-btn-sm" type="submit">Decline</button></form>
                        </>}
                        {r.status === "approved" && <form action={resolveReturn}><input type="hidden" name="returnId" value={r.id} /><input type="hidden" name="status" value="refunded" /><button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">Mark refunded</button></form>}
                        {(r.status === "rejected" || r.status === "refunded") && <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="adm-note info" style={{ marginTop: 16 }}><Icon name="info" /> Refund money movement runs through the payment gateway once its keys are configured; the status is tracked through to &ldquo;refunded&rdquo; here.</div>
    </div>
  );
}
