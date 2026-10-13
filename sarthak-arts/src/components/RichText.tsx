/**
 * Plain text the owner edits in admin, rendered with light formatting — one block per line:
 *   # Title     ## Heading     ### Subtitle
 *   Label: text      → bold label (when the label is a few words)
 *   [ Button text ]  → a button linking to `buttonHref`
 *   anything else    → a paragraph
 */
export function RichText({ text, buttonHref, className }: { text: string; buttonHref?: string; className?: string }) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return (
    <div className={`rich-text${className ? ` ${className}` : ""}`}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="rt-sub">{line.slice(4)}</p>;
        if (line.startsWith("## ")) return <h3 key={i} className="rt-h serif">{line.slice(3)}</h3>;
        if (line.startsWith("# ")) return <h2 key={i} className="rt-title serif">{line.slice(2)}</h2>;
        const btn = line.match(/^\[\s*(.+?)\s*\]$/);
        if (btn) return buttonHref ? <a key={i} href={buttonHref} className="rt-btn">{btn[1]}</a> : null;
        const label = line.match(/^([^:.]{2,60}):\s+(.+)$/);
        if (label && label[1].split(/\s+/).length <= 7) return <p key={i}><b>{label[1]}:</b> {label[2]}</p>;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
