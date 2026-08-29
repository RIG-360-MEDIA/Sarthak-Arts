import type { Metadata } from "next";
import Link from "next/link";
import "./glossary.css";
import { GLOSSARY, GLOSSARY_GROUPS } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Understanding the terms — A little glossary | Sarthak Arts",
  description: "Plain-language meanings for the Vāstu and Hindu-calendar terms used across Sarthak Arts — Choghadiya, tithi, nakshatra, muhūrta, the directions and more.",
};

export default function GlossaryPage() {
  return (
    <div className="glo-root">
      <header className="glo-hero bleed">
        <div className="eyebrow">A little glossary</div>
        <h1>Understanding the terms</h1>
        <p>Our pieces and pages use the words of the tradition. Here's what each one means, in plain language — no prior knowledge needed.</p>
      </header>

      <div className="glo-wrap">
        <nav className="glo-jump" aria-label="Jump to a section">
          {GLOSSARY_GROUPS.map((g) => <a key={g.key} href={`#group-${g.key}`}>{g.title}</a>)}
        </nav>

        {GLOSSARY_GROUPS.map((group) => {
          const terms = Object.entries(GLOSSARY).filter(([, e]) => e.group === group.key);
          return (
            <section key={group.key} id={`group-${group.key}`} className="glo-group">
              <div className="glo-group-head">
                <h2>{group.title}</h2>
                <p>{group.blurb}</p>
              </div>
              <div className="glo-terms">
                {terms.map(([key, e]) => (
                  <article key={key} id={key} className="glo-term">
                    <div className="glo-term-h">
                      <span className="name">{e.term}</span>
                      {e.deva && <span className="deva" lang="sa">{e.deva}</span>}
                      <span className="short">{e.short}</span>
                    </div>
                    <p>{e.long}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <div className="glo-cta">
          <h3>Still unsure where a piece belongs?</h3>
          <p>A short consultation, or the two-minute audit, will guide you to the right corner.</p>
          <Link href="/consultation">Talk to an expert</Link>
        </div>
      </div>
    </div>
  );
}
