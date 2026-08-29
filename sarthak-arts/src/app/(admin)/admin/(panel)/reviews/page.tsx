import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { ReviewStatusPill } from "../../_ui/status";
import { setReviewStatus, replyToReview } from "./actions";

export const dynamic = "force-dynamic";

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "var(--gold)" }} aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" style={{ width: 14, height: 14, fill: i <= n ? "var(--gold)" : "none", color: i <= n ? "var(--gold)" : "var(--line)" }} />)}
    </span>
  );
}

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Reviews</h1>
          <p className="lead">{reviews.length} review{reviews.length === 1 ? "" : "s"} from your customers.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="adm-table-wrap"><div className="adm-empty">
          <div className="em-ic"><Icon name="reviews" /></div>
          <h3>No reviews yet</h3>
          <p>When customers review your pieces, you&apos;ll be able to publish, hide, and reply to them here.</p>
        </div></div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {reviews.map((r) => (
            <div key={r.id} className="adm-card adm-card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <b style={{ fontSize: 14.5 }}>{r.customerName}</b>
                    <Stars n={r.rating} />
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>on {r.product.name}</div>
                </div>
                <ReviewStatusPill status={r.status} />
              </div>

              <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, margin: "12px 0 0" }}>{r.body}</p>

              {r.sellerReply && (
                <div style={{ marginTop: 12, marginLeft: 4, paddingLeft: 12, borderLeft: "2px solid var(--brass)" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--brass-deep)", fontWeight: 700 }}>Your reply</div>
                  <p style={{ fontSize: 13.5, margin: "3px 0 0", color: "var(--ink)" }}>{r.sellerReply}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                <form action={setReviewStatus}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "hidden" ? "published" : "hidden"} />
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">{r.status === "hidden" ? <><Icon name="eye" /> Publish</> : <>Hide</>}</button>
                </form>
                <form action={replyToReview} style={{ display: "flex", gap: 8, flex: 1, minWidth: 220 }}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <input className="adm-input" name="reply" placeholder="Write a public reply…" defaultValue={r.sellerReply ?? ""} style={{ flex: 1 }} />
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit">Save reply</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
