import Link from "next/link";

/**
 * LegalDoc — renders an owner-editable legal content block as a polished,
 * readable document. The body is plain text (editable in the admin Content
 * page); paragraphs that open with a short "Label." lead become section
 * headings with a sticky table of contents. Emails are linkified.
 */
type Section = { heading: string; id: string; body: string };

const SIBLINGS = [
  { key: "legal.privacy", label: "Privacy", href: "/privacy" },
  { key: "legal.terms", label: "Terms", href: "/terms" },
  { key: "legal.shipping", label: "Shipping & Returns", href: "/shipping-returns" },
];

const EMAIL = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(EMAIL);
  return <>{parts.map((part, i) => (i % 2 === 1 ? <a key={i} href={`mailto:${part}`}>{part}</a> : part))}</>;
}

function parse(body: string): { leadParas: string[]; sections: Section[] } {
  const paras = body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const leadParas: string[] = [];
  const sections: Section[] = [];
  for (const p of paras) {
    const m = p.match(/^([A-Z][A-Za-z][A-Za-z &/]{1,36}?)\.\s+([\s\S]+)$/);
    const words = m ? m[1].trim().split(/\s+/).length : 0;
    if (m && words <= 6) {
      sections.push({ heading: m[1].trim(), id: slugify(m[1].trim()), body: m[2].trim() });
    } else if (sections.length) {
      sections[sections.length - 1].body += "\n\n" + p;
    } else {
      leadParas.push(p);
    }
  }
  return { leadParas, sections };
}

export function LegalDoc({ title, body, updatedAt, currentKey }: { title: string; body: string; updatedAt?: Date; currentKey: string }) {
  const { leadParas, sections } = parse(body);
  const updated = updatedAt
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(updatedAt)
    : null;

  return (
    <div className="legal-root">
      <div className="legal-wrap">
        <div className="legal-header">
          <div className="legal-eyebrow">Legal</div>
          <h1>{title}</h1>
          {updated && (
            <div className="legal-updated">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
              Last updated {updated}
            </div>
          )}
        </div>

        <div className="legal-layout">
          {sections.length > 0 && (
            <nav className="legal-toc" aria-label="On this page">
              <div className="toc-label">On this page</div>
              <ol>
                {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}
              </ol>
            </nav>
          )}

          <div className="legal-article">
            <article className="legal-card">
              {leadParas.map((p, i) => (
                i === 0
                  ? <p key={i} className="legal-lead"><LinkedText text={p} /></p>
                  : <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink-muted)", marginTop: 14 }}><LinkedText text={p} /></p>
              ))}
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="legal-section">
                  <h2>{s.heading}</h2>
                  {s.body.split(/\n\s*\n/).map((para, i) => <p key={i}><LinkedText text={para} /></p>)}
                </section>
              ))}
            </article>

            <div className="legal-siblings">
              {SIBLINGS.map((sib) => (
                <Link key={sib.key} href={sib.href} className={`legal-sibling${sib.key === currentKey ? " current" : ""}`}>{sib.label}</Link>
              ))}
            </div>
            <p className="legal-foot">Questions about this page? Write to <a href="mailto:hello@sarthakarts.com">hello@sarthakarts.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
