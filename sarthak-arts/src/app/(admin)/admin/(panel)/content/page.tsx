import { prisma } from "@/lib/db";
import { Icon } from "../../_ui/icons";
import { saveBlock, uploadContentImage } from "./actions";

export const dynamic = "force-dynamic";

/** Turn a snake/kebab content key into a friendly label, e.g. "home_hero_title" → "Home hero title". */
function prettyKey(key: string) {
  return key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ flash?: string }> }) {
  const { flash } = await searchParams;
  const all = await prisma.contentBlock.findMany({ orderBy: { key: "asc" } });
  const images = all.filter((b) => b.key.startsWith("image."));
  const blocks = all.filter((b) => !b.key.startsWith("image."));

  return (
    <div className="adm-page narrow">
      <div className="adm-page-head">
        <div>
          <h1>Content</h1>
          <p className="lead">Edit the words on your website. Changes go live the moment you save.</p>
        </div>
      </div>

      {flash === "image-saved" && <div className="adm-note info" style={{ marginBottom: 16 }}><Icon name="checkCircle" /> Photo updated — it&apos;s live now.</div>}
      {flash === "image-error" && <div className="adm-note brass" style={{ marginBottom: 16 }}><Icon name="alert" /> That photo couldn&apos;t be used. Please upload a JPG, PNG or WebP under 4 MB.</div>}

      {images.length > 0 && (
        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          {images.map((b) => (
            <form key={b.key} action={uploadContentImage} className="adm-fieldset" style={{ margin: 0 }}>
              <input type="hidden" name="key" value={b.key} />
              <div className="adm-fieldset-head"><h3>Photo: {b.title ?? prettyKey(b.key)}</h3><p>Used on the Consultation and About pages.</p></div>
              <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                {b.body && <img src={b.body} alt="" style={{ width: 120, height: 150, objectFit: "cover", borderRadius: 12, border: "1px solid var(--line)" }} />}
                <div style={{ display: "grid", gap: 8 }}>
                  <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
                  <button className="adm-btn adm-btn-primary adm-btn-sm" type="submit"><Icon name="check" /> Upload new photo</button>
                </div>
              </div>
            </form>
          ))}
        </div>
      )}

      <div className="adm-note info" style={{ marginBottom: 16 }}>
        <Icon name="info" />
        <div>Formatting for long texts: start a line with <b>## </b> for a heading or <b>### </b> for a small subtitle; write <b>Label: text</b> for a bold label; put a button on its own line as <b>[ Button text ]</b>. Each line becomes its own paragraph.</div>
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
