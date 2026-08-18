import type { Metadata } from "next";
import Link from "next/link";
import "./collection.css";
import { getCollectionView, parseFilters, toQuery } from "@/lib/collection";
import { PieceDefs } from "@/components/collection/Piece";
import { MandalaHome } from "@/components/collection/MandalaHome";
import { NicheCard } from "@/components/collection/NicheCard";
import { CollectionCompass } from "@/components/collection/CollectionCompass";
import { Toolbar } from "@/components/collection/Toolbar";
import { BackToTop } from "@/components/collection/BackToTop";

export const metadata: Metadata = {
  title: "The Collection — Handcrafted Vāstu Pieces by Direction | Sarthak Arts",
  description:
    "Browse handcrafted Vāstu pieces in copper, brass and silver, arranged by the nine directions of the home. Each piece is built for one zone and certified per piece.",
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const density = sp.density === "compact" ? "compact" : "comfortable";
  const view = await getCollectionView(filters);

  // Shared param bags for URL-driven links.
  const sortParam = filters.sort === "newest" ? undefined : filters.sort;
  const densityParam = density === "compact" ? "compact" : undefined;
  const dirCsv = filters.directions.join(",") || undefined;
  const nonDir = { category: filters.category, metal: filters.metal, sort: sortParam, density: densityParam };
  const currentAll = { direction: dirCsv, ...nonDir };

  const dirName = (code: string) => view.directions.find((d) => d.code === code)?.name ?? code;
  const catName = view.categories.find((c) => c.code === filters.category)?.name;
  const lead =
    filters.directions.length ? filters.directions.map(dirName).join(" · ")
    : filters.category ? (catName ?? "The collection")
    : "The full collection";

  return (
    <div className="col-root">
      <PieceDefs />

      {/* ── Dark sanctum hero ── */}
      <header className="col-hero bleed">
        <svg className="wm" viewBox="0 0 200 200" aria-hidden="true">
          {/* Aṣṭadala Padma — one clean ring of eight lotus petals, each holding a
              single auspicious symbol (svastika at the cardinals, a sacred flame at
              the ordinals), around the Brahmasthān (ॐ). Kept spare so it reads. */}
          <g fill="none" stroke="#E8A81C" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="100" cy="100" r="95" strokeWidth="0.4" />
            <circle cx="100" cy="100" r="89" strokeWidth="0.55" />
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={`p${i}`} transform={`rotate(${i * 45} 100 100)`} strokeWidth="0.8"
                d="M100 60 C83 54 79 32 100 13 C121 32 117 54 100 60 Z" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = ((-90 + i * 45) * Math.PI) / 180;
              const cx = (100 + 62 * Math.cos(a)).toFixed(1);
              const cy = (100 + 62 * Math.sin(a)).toFixed(1);
              return (
                <g key={`sym${i}`} transform={`translate(${cx} ${cy})`} strokeWidth="0.7">
                  {i % 2 === 0 ? (
                    <path d="M0 -4.6 V4.6 M-4.6 0 H4.6 M0 -4.6 h2.7 M4.6 0 v2.7 M0 4.6 h-2.7 M-4.6 0 v-2.7" />
                  ) : (
                    <path d="M0 3.4 C-3 1 -2.4 -3 0 -6.4 C2.4 -3 3 1 0 3.4 Z" />
                  )}
                </g>
              );
            })}
            <circle cx="100" cy="100" r="25" strokeWidth="0.7" />
          </g>
          <text x="100" y="101" textAnchor="middle" dominantBaseline="central" fontFamily="'Noto Serif Devanagari','Nirmala UI',serif" fontSize="25" fill="#E8A81C">ॐ</text>
        </svg>
        <div className="col-hero-in">
          <span className="col-eyebrow">Sarthak Arts · The Collection</span>
          <h1>Nine directions,<br /><em>one for every corner of home.</em></h1>
          <p className="sub">
            Each piece is cast in copper, brass or silver for a single direction of the home — under its guardian Dikpāla, and marked by its colour. Turn the wheel to find yours.
          </p>
          <div className="meta">
            <span><b>{view.totalLive}</b> pieces</span>
            <span><b>9</b> directions</span>
            <span>Certified metal &amp; stone</span>
          </div>
        </div>
      </header>

      {/* ── Trust strip ── */}
      <div className="col-trust bleed">
        <div className="col-trust-in">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg><b>Certified</b>&nbsp;metal &amp; gemstone</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg><b>Free shipping</b>&nbsp;over ₹15,000</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg><b>7-day</b>&nbsp;easy returns</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l2 4 4 .5-3 3 .8 4.5L12 13l-3.8 2 .8-4.5-3-3 4-.5z" /></svg><b>Handcrafted</b>&nbsp;to order</span>
        </div>
      </div>

      <div className="col-layout">
        {/* ── Rail: compass filter + guide ── */}
        <aside className="col-rail">
          <div className="fcard">
            <div className="fcard-lbl">Filter by direction</div>
            <CollectionCompass directions={view.directions} selected={filters.directions} baseParams={nonDir} totalLive={view.totalLive} />
          </div>
          <div className="rail-guide">
            <div className="rg-title">Not sure where it belongs?</div>
            <div className="rg-sub">Placement depends on your home&apos;s layout — let us point you to the right corner.</div>
            <Link href="/home-audit"><span>Take the 2-minute home audit</span><span className="arw">→</span></Link>
            <Link href="/consultation"><span>Book a placement consult</span><span className="arw">→</span></Link>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="col-main">
          <nav className="catnav" aria-label="Filter by type">
            <Link href={toQuery({ ...currentAll, category: undefined })} className={`catpill${!filters.category ? " on" : ""}`}>
              All <span className="n">{view.totalLive}</span>
            </Link>
            {view.categories.map((c) => (
              <Link
                key={c.code}
                href={toQuery({ ...currentAll, category: filters.category === c.code ? undefined : c.code })}
                className={`catpill${filters.category === c.code ? " on" : ""}`}
              >
                {c.name} <span className="n">{c.count}</span>
              </Link>
            ))}
          </nav>

          <Toolbar lead={lead} count={view.pieces.length} sort={filters.sort} density={density} current={currentAll} />

          <MandalaHome directions={view.directions} selected={filters.directions} baseParams={nonDir} />

          {view.pieces.length === 0 ? (
            <div className="col-empty">
              <div className="om sa-deva" aria-hidden="true">ॐ</div>
              <h3>No pieces in this corner yet</h3>
              <p>Try another direction or type — or <Link href="/collection">see the full collection</Link>.</p>
            </div>
          ) : (
            <div className={`field${density === "compact" ? " compact" : ""}`}>
              {view.pieces.map((p) => (
                <NicheCard key={p.slug} p={p} compact={density === "compact"} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Sacred close ── */}
      <section className="col-closing bleed">
        <div className="om sa-deva" aria-hidden="true">ॐ</div>
        <p className="cl-line">Made by hand. Placed with intention.</p>
        <p className="cl-sub">Sarthak Arts · a piece for every corner of home</p>
      </section>

      <BackToTop />
    </div>
  );
}
