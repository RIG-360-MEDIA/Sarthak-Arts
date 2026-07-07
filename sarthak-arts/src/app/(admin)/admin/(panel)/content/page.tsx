import { prisma } from "@/lib/db";
import { saveBlock } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const blocks = await prisma.contentBlock.findMany({ orderBy: { key: "asc" } });
  return (
    <div style={{ padding: "22px 26px", maxWidth: 760 }}>
      <h1>Content</h1>
      <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Edit the words on your site — changes go live immediately.</p>
      {blocks.map((b) => (
        <form key={b.key} action={saveBlock} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginTop: 12 }}>
          <input type="hidden" name="key" value={b.key} />
          <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "monospace" }}>{b.key}</div>
          <label>Title</label>
          <input name="title" defaultValue={b.title ?? ""} />
          <label>Body</label>
          <textarea name="body" rows={3} defaultValue={b.body} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Updated {b.updatedAt.toISOString().slice(0, 10)}{b.updatedBy ? ` by ${b.updatedBy}` : ""}</span>
            <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 12px" }}>Save</button>
          </div>
        </form>
      ))}
    </div>
  );
}
