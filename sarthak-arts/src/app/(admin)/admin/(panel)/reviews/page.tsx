import { prisma } from "@/lib/db";
import { setReviewStatus, replyToReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
  return (
    <div style={{ padding: "22px 26px", maxWidth: 760 }}>
      <h1>Reviews</h1>
      {reviews.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><strong>{r.customerName}</strong> · {r.rating}★ · <span style={{ color: "var(--ink-muted)" }}>{r.product.name}</span></div>
            <div style={{ fontSize: 12, color: r.status === "hidden" ? "var(--critical)" : "var(--success)" }}>{r.status}</div>
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: "6px 0" }}>{r.body}</p>
          {r.sellerReply && <p style={{ fontSize: 13, marginLeft: 12, paddingLeft: 10, borderLeft: "2px solid var(--brass)" }}><strong>Reply:</strong> {r.sellerReply}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <form action={setReviewStatus}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input type="hidden" name="status" value={r.status === "hidden" ? "published" : "hidden"} />
              <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>{r.status === "hidden" ? "Publish" : "Hide"}</button>
            </form>
            <form action={replyToReview} style={{ display: "flex", gap: 6, flex: 1 }}>
              <input type="hidden" name="reviewId" value={r.id} />
              <input name="reply" placeholder="Reply publicly…" defaultValue={r.sellerReply ?? ""} style={{ flex: 1 }} />
              <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Save reply</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
