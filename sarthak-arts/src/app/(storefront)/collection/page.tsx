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
          {/* Aṣṭadala Padma — a layered eight-petalled lotus (outer + offset mid +
              inner rows) with a pearl border and the Brahmasthān (ॐ) at its still
              centre. The platform's motif: eight directions around one quiet core. */}
          <g fill="none" stroke="#E8A81C" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="100" cy="100" r="97" strokeWidth="0.35" />
            <circle cx="100" cy="100" r="88" strokeWidth="0.6" />
            {/* pearl border */}
            {Array.from({ length: 32 }).map((_, i) => {
              const a = (i * 11.25 * Math.PI) / 180;
              return <circle key={`pearl${i}`} cx={(100 + 97 * Math.cos(a)).toFixed(1)} cy={(100 + 97 * Math.sin(a)).toFixed(1)} r="0.7" fill="#E8A81C" stroke="none" />;
            })}
            {/* outer petals — with an inner vein */}
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={`op${i}`} transform={`rotate(${i * 45} 100 100)`}>
                <path strokeWidth="0.8" d="M100 51 C85 46 81 28 100 12 C119 28 115 46 100 51 Z" />
                <path strokeWidth="0.45" d="M100 47 C97.5 39 97.5 27 100 18" />
              </g>
            ))}
            {/* mid petals — offset, filling the gaps */}
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={`mp${i}`} transform={`rotate(${i * 45 + 22.5} 100 100)`} strokeWidth="0.6"
                d="M100 57 C91 53 89 39 100 29 C111 39 109 53 100 57 Z" />
            ))}
            {/* inner lotus — a small row cupping the centre */}
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={`ip${i}`} transform={`rotate(${i * 45} 100 100)`} strokeWidth="0.5"
                d="M100 73 C94.5 69 93.5 61 100 55 C106.5 61 105.5 69 100 73 Z" />
            ))}
            {/* pearls at each outer petal tip */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = ((-90 + i * 45) * Math.PI) / 180;
              return <circle key={`tip${i}`} cx={(100 + 90 * Math.cos(a)).toFixed(1)} cy={(100 + 90 * Math.sin(a)).toFixed(1)} r="1.4" fill="#E8A81C" stroke="none" />;
            })}
            {/* centre bindu — double ring */}
            <circle cx="100" cy="100" r="25" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="21" strokeWidth="0.35" />
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
