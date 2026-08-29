import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { saveBlock } from "./actions";

export const dynamic = "force-dynamic";

/** Turn a snake/kebab content key into a friendly label, e.g. "home_hero_title" → "Home hero title". */
function prettyKey(key: string) {
  return key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AdminContent() {
  const blocks = await prisma.contentBlock.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Content</h1>
          <p className="lead">Edit the words on your website. Changes go live the moment you save.</p>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="adm-table-wrap"><div className="adm-empty">
          <div className="em-ic"><Icon name="content" /></div>
          <h3>No editable content blocks yet</h3>
          <p>Editable sections of your site will appear here as they&apos;re wired up.</p>
        </div></div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {blocks.map((b) => (
            <form key={b.key} action={saveBlock} className="adm-fieldset" style={{ margin: 0 }}>
              <input type="hidden" name="key" value={b.key} />
              <div className="adm-fieldset-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3>{prettyKey(b.key)}</h3>
                <span style={{ fontSize: 10.5, color: "var(--ink-faint)", fontFamily: "monospace" }}>{b.key}</span>
              </div>
              <div className="adm-field">
                <label>Title</label>
                <input name="title" defaultValue={b.title ?? ""} />
              </div>
              <div className="adm-field">
                <label>Body</label>
                <textarea name="body" rows={Math.min(16, Math.max(3, b.body.split("\n").length + 1))} defaultValue={b.body} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Updated {b.updatedAt.toISOString().slice(0, 10)}{b.updatedBy ? ` by ${b.updatedBy}` : ""}</span>
                <button className="adm-btn adm-btn-primary adm-btn-sm" type="submit"><Icon name="check" /> Save</button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
