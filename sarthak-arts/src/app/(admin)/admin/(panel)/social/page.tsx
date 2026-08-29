import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { pinPost, unpinPost } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSocial() {
  const [accounts, posts] = await Promise.all([
    prisma.socialAccount.findMany(),
    prisma.socialPost.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Social</h1>
          <p className="lead">Curate the posts that appear on your storefront.</p>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="adm-chips" style={{ marginBottom: 18 }}>
          {accounts.map((a) => (
            <span key={a.platform} className="adm-chip" style={{ cursor: "default", textTransform: "capitalize" }}><Icon name="social" style={{ width: 13, height: 13, marginRight: 4, verticalAlign: "-2px" }} />{a.platform} · {a.handle}</span>
          ))}
        </div>
      )}

      <div className="adm-subhead">Pinned posts</div>
      {posts.length === 0 ? (
        <div className="adm-table-wrap"><div className="adm-empty" style={{ padding: "36px 20px" }}>
          <div className="em-ic"><Icon name="social" /></div>
          <h3>No pinned posts</h3>
          <p>Pin a post below and it will feature on your storefront.</p>
        </div></div>
      ) : (
        <div className="adm-thumbs" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {posts.map((p) => (
            <div key={p.id} className="adm-card adm-card-pad" style={{ padding: 12 }}>
              <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5, minHeight: 34 }}>{p.caption}</div>
              <form action={unpinPost} style={{ marginTop: 8 }}>
                <input type="hidden" name="postId" value={p.id} />
                <button className="adm-btn adm-btn-ghost adm-btn-sm" type="submit" style={{ width: "100%" }}><Icon name="trash" /> Remove</button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={pinPost} className="adm-fieldset" style={{ marginTop: 18 }}>
        <div className="adm-fieldset-head"><h3>Pin a post</h3></div>
        <div className="adm-field-row">
          <div className="adm-field"><label>Platform</label><input name="platform" defaultValue="instagram" /></div>
          <div className="adm-field"><label>Media URL</label><input name="mediaUrl" placeholder="/uploads/… or https://…" /></div>
        </div>
        <div className="adm-field"><label>Caption<span className="req">*</span></label><input name="caption" required /></div>
        <div className="adm-field"><label>Permalink</label><input name="permalink" placeholder="https://…" /></div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="adm-btn adm-btn-primary" type="submit"><Icon name="plus" /> Pin post</button>
        </div>
      </form>

      <div className="adm-note info" style={{ marginTop: 16 }}><Icon name="info" /> Posts are curated by hand for now; automatic syncing from Instagram is a later upgrade.</div>
    </div>
  );
}
