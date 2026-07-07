import { prisma } from "@/lib/db";
import { pinPost, unpinPost } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSocial() {
  const [accounts, posts] = await Promise.all([
    prisma.socialAccount.findMany(),
    prisma.socialPost.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div style={{ padding: "22px 26px", maxWidth: 720 }}>
      <h1>Social content</h1>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {accounts.map((a) => (
          <div key={a.platform} style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "8px 12px", fontSize: 13 }}>
            <strong style={{ textTransform: "capitalize" }}>{a.platform}</strong> · {a.handle}
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 20 }}>Pinned posts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {posts.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 12 }}>{p.caption}</div>
            <form action={unpinPost}>
              <input type="hidden" name="postId" value={p.id} />
              <button className="btn-ghost" style={{ fontSize: 11, padding: "2px 8px", marginTop: 6 }}>Remove</button>
            </form>
          </div>
        ))}
      </div>
      <form action={pinPost} style={{ marginTop: 16, maxWidth: 420 }}>
        <label>Platform</label>
        <input name="platform" defaultValue="instagram" />
        <label>Caption</label>
        <input name="caption" required />
        <label>Media URL</label>
        <input name="mediaUrl" placeholder="/placeholder/…" />
        <label>Permalink</label>
        <input name="permalink" placeholder="https://…" />
        <button className="btn-ghost" style={{ marginTop: 10 }}>+ Pin a post</button>
      </form>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>Curated manually now; live API sync is a later upgrade (the source field already supports it).</p>
    </div>
  );
}
