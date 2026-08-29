"use client";
import { useEffect, useState } from "react";

type Section = { id: string; label: string };

/**
 * ProductSectionNav — a slim wayfinding bar that sticks below the site header on
 * a long page and highlights the section you're reading (scroll-spy). It mirrors
 * Amazon's on-scroll anchor nav, but tuned to our journey: see → place → know →
 * story → voices. Anchors scroll smoothly; the active link is lit in gold.
 */
export function ProductSectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="pdp-secnav" aria-label="On this page">
      <div className="pdp-secnav-in">
        {sections.map((s) => (
          <a
            key={s.id} href={`#${s.id}`} onClick={(e) => go(e, s.id)}
            className={`psn-link${active === s.id ? " on" : ""}`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
