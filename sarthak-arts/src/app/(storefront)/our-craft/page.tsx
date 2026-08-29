import type { Metadata } from "next";
import Link from "next/link";
import "../content-pages.css";
import { getBlock } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Our Craft — Sarthak Arts" };

const STEPS = [
  { name: "Design", desc: "Each piece begins as a drawing — aligned to its direction, deity and element.", icon: (<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.3 5.2-5.2 2.3 2.3-5.2z" /></>) },
  { name: "Shape", desc: "Cast and hand-worked in copper, brass or silver by artisans.", icon: (<><path d="M12 3v4M6 21h12M9 21V10a3 3 0 0 1 6 0v11" /><path d="M8 7h8" /></>) },
  { name: "Set", desc: "Gemstones set by hand, where the tradition calls for them.", icon: (<path d="M6 3h12l3 6-9 12L3 9z M3 9h18 M9 3 6 9l6 12 6-12-3-6" />) },
  { name: "Certify", desc: "Weighed, verified and issued a certificate of composition.", icon: (<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>) },
];

export default async function OurCraft() {
  const [intro, materials, stones] = await Promise.all([
    getBlock("our-craft.intro"),
    getBlock("our-craft.materials"),
    getBlock("our-craft.stones"),
  ]);

  return (
    <div className="pg-root">
      <div className="pg-wrap narrow">
        <div className="pg-hero">
          <div className="pg-eyebrow">Our craft</div>
          <h1 className="serif">{intro.title ?? "Made by hand, for a purpose"}</h1>
          <p className="pg-lead">{intro.body}</p>
        </div>

        <div className="craft-process">
          {STEPS.map((s, i) => (
            <div key={s.name} className="craft-step">
              <span className="n">{i + 1}</span>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{s.icon}</svg></span>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="craft-block">
          <h2 className="serif">{materials.title ?? "The metals"}</h2>
          <p>{materials.body}</p>
        </div>

        <div className="craft-band">
          <h2 className="serif">{stones.title ?? "The stones"}</h2>
          <p>{stones.body}</p>
        </div>

        <div className="craft-cta">
          <Link href="/collection" className="pg-btn primary">Explore the collection
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
