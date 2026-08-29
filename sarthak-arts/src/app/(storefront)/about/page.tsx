import type { Metadata } from "next";
import Link from "next/link";
import "./about.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Sarthak Arts — Handcrafted Vāstu Pieces, Made With Intention",
  description:
    "Sarthak Arts makes handcrafted Vāstu pieces in copper, brass and silver — each built for one direction of the home, certified per piece, and consecrated to be placed with intention.",
};

const PRINCIPLES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12V6a2 2 0 0 1 4 0v5" /><path d="M10 11V4a2 2 0 0 1 4 0v7" /><path d="M14 10V6a2 2 0 0 1 4 0v8a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7l-2.3-3.4a2 2 0 0 1 3.3-2.2L8 13" /></svg>),
    title: "Made by hand",
    body: "One artisan takes each piece from raw metal to finished form. Nothing is cast from a mould twice — every piece carries the marks of the hand that made it.",
  },
  {
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 12 8 8m4 4 4-4m-4 4-3 5m3-5 3 5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>),
    title: "Made for one direction",
    body: "Every piece is built for a single Vāstu zone — under its guardian Dikpāla, in its element. Not décor for anywhere, but an object for one corner.",
  },
  {
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>),
    title: "Certified per piece",
    body: "Exact metal weight and gemstone are measured, stated and signed for each individual piece — never averaged across a batch. What you're told is what you hold.",
  },
  {
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-1.6-3-1.4-6.4 0-9 1.4 2.6 1.6 6 0 9Z" /><path d="M10.8 20c-2.8-2.4-3.4-5-2.9-7.2M13.2 20c2.8-2.4 3.4-5 2.9-7.2" /><path d="M8 20q4 2.2 8 0" /></svg>),
    title: "Placed with intention",
    body: "Each order ships with a printed ritual card — the four-fold Prāṇa Pratiṣṭhā — so a made object can become a sacred one, placed in its right corner.",
  },
];

const PROMISES: { big: React.ReactNode; label: string; deva?: boolean }[] = [
  { big: "9", label: "Directions of the home" },
  { big: "1 : 1", label: "Certified individually, per piece" },
  { big: "ॐ", label: "Ritual card in every box", deva: true },
  { big: "7-day", label: "Easy returns" },
];

export default async function About() {
  return (
    <div className="about-root">
      {/* ── Hero ── */}
      <header className="about-hero bleed">
        <svg className="wm" viewBox="0 0 200 200" aria-hidden="true">
          <g fill="none" stroke="#E8A81C" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="100" cy="100" r="94" strokeWidth="0.4" />
            <circle cx="100" cy="100" r="66" strokeWidth="0.55" />
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={i} transform={`rotate(${i * 45} 100 100)`} strokeWidth="0.7"
                d="M100 66 C86 60 82 40 100 22 C118 40 114 60 100 66 Z" />
            ))}
            <circle cx="100" cy="100" r="22" strokeWidth="0.7" />
          </g>
          <text x="100" y="101" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif Devanagari','Nirmala UI',serif" fontSize="22" fill="#E8A81C">ॐ</text>
        </svg>
        <div className="about-hero-in">
          <span className="about-eyebrow">About Sarthak Arts</span>
          <h1>Objects made to be placed —<br /><em>not just owned.</em></h1>
          <p className="sub">
            We make handcrafted Vāstu pieces in copper, brass and silver — each one built for a single
            direction of the home, certified individually, and consecrated for the life lived around it.
          </p>
        </div>
      </header>

      {/* ── Belief ── */}
      <section className="about-section about-belief">
        <span className="about-kicker">Why we exist</span>
        <h2 className="about-h serif">Made for the corner it <em>belongs</em> to.</h2>
        <p>
          In Vāstu Śāstra the home is a living body — nine directions, each a limb, each guarded by a
          Dikpāla and belonging to an element. <b>Sarthak Arts</b> began with one conviction: that the
          objects placed in those corners should be made with the same intention they are meant to hold.
        </p>
        <p>
          So we don't mass-produce décor. Each piece is cast, shaped and certified one at a time —
          <b> made for the corner it belongs to</b>, and sent with the guidance to place it there.
          <span className="sa-deva"> ॥ शुभं भवतु ॥</span>
        </p>
      </section>

      {/* ── Principles ── */}
      <section className="about-section" style={{ paddingTop: 0 }}>
        <span className="about-kicker">What we hold to</span>
        <h2 className="about-h serif">Four things we don&apos;t compromise.</h2>
        <div className="about-principles">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="aprin">
              <span className="aprin-icon">{p.icon}</span>
              <div className="aprin-title">{p.title}</div>
              <div className="aprin-body">{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Craft strip ── */}
      <section className="about-section" style={{ paddingTop: 0 }}>
        <div className="about-craft">
          <div className="about-craft-copy">
            <div className="t serif">Copper, brass, silver — worked by hand.</div>
            <div className="s">Metal chosen for the piece, shaped, set with stone, and weighed before it leaves the workshop.</div>
          </div>
          <Link href="/our-craft" className="about-craft-link">See how it&apos;s made →</Link>
        </div>
      </section>

      {/* ── Accuracy (deep band) ── */}
      <section className="about-accuracy bleed">
        <div className="about-accuracy-in">
          <span className="about-kicker light">On accuracy</span>
          <h2>If we&apos;re not sure, we leave it out.</h2>
          <p>
            The tradition is the whole point — so we don&apos;t guess with it. Every direction, guardian
            deity and ritual on this site is checked against classical sources. Where the texts disagree
            or we can&apos;t verify, we say less rather than say something wrong. For a devotional piece,
            an absent claim is always better than a false one.
          </p>
          <p className="src">
            Verified against <em>Bṛhat Saṃhitā</em>, the <em>Purāṇas</em>, and <em>Āgama</em> ritual
            manuals · panchāṅga computed on the Lahiri ayanamsa.
          </p>
        </div>
      </section>

      {/* ── Promises ── */}
      <section className="about-section">
        <span className="about-kicker">In every order</span>
        <h2 className="about-h serif">What&apos;s always true.</h2>
        <div className="about-promises">
          {PROMISES.map((p, i) => (
            <div key={i} className="aprom">
              <b className={p.deva ? "sa-deva" : undefined}>{p.big}</b>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote (deep band) ── */}
      <section className="about-quote bleed">
        <div className="om" aria-hidden="true">ॐ</div>
        <blockquote>Made by hand. Placed with intention.</blockquote>
        <cite>The Sarthak Arts promise</cite>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <h2 className="serif">Find the piece for your corner.</h2>
        <p>Browse the collection, or sit with a consultant to place it right.</p>
        <div className="about-cta-row">
          <Link href="/collection" className="about-btn primary">Explore the collection</Link>
          <Link href="/consultation" className="about-btn ghost">Book a consultation</Link>
        </div>
      </section>
    </div>
  );
}
