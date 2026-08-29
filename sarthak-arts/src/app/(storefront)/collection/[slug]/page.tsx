import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import "./product.css";
import { prisma } from "@/lib/db";
import { resolveDisplayCurrency, formatDisplay } from "@/lib/currency";
import { visualFor, DIRECTION_ANGLE } from "@/lib/direction-visual";
import { glyphForCategory, gradForMetal } from "@/lib/collection";
import { PieceDefs, PieceRender } from "@/components/collection/Piece";
import { AddToCart } from "@/components/collection/AddToCart";
import { WishlistHeart } from "@/components/hero/WishlistHeart";
import { ProductGallery } from "./ProductGallery";
import { ProductSectionNav } from "./ProductSectionNav";
import { isShopifyEnabled } from "@/lib/shopify/config";
import { getShopifyProduct } from "@/lib/shopify/products";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (isShopifyEnabled()) {
    const sp = await getShopifyProduct(slug).catch(() => null);
    if (!sp) return { title: "Product — Sarthak Arts" };
    return {
      title: `${sp.name} — ${sp.directionName} Vāstu Piece | Sarthak Arts`,
      description: `${sp.name}, handcrafted for the ${sp.directionName} corner of the home. Ships with a placement guide and certificate.`,
    };
  }
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { directions: { include: { direction: true } }, composition: { include: { metal: true } } },
  });
  if (!p) return { title: "Product — Sarthak Arts" };
  const dir = p.directions[0]?.direction.name ?? "Vāstu";
  const metal = p.composition.find((c) => c.metal)?.metal?.name ?? "copper, brass & silver";
  return {
    title: `${p.name} — ${dir} Vāstu Piece in ${metal} | Sarthak Arts`,
    description: `${p.name}, handcrafted for the ${dir} corner of the home. Ships with a placement guide and a certificate of composition.`,
  };
}

/** Five stars, filled to a rating (rounded to the nearest half). */
function Stars({ value }: { value: number }) {
  const v = Math.round(value * 2) / 2;
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star${v >= i ? " full" : v >= i - 0.5 ? " half" : ""}`}>★</span>
      ))}
    </span>
  );
}

/** A small sacred compass with the piece's own corner lit in its colour. */
function PlacementCompass({ litCode, color, colorDeep }: { litCode: string; color: string; colorDeep: string }) {
  const P = (deg: number, rad: number) => [60 + rad * Math.cos((deg * Math.PI) / 180), 60 + rad * Math.sin((deg * Math.PI) / 180)];
  const codes = Object.keys(DIRECTION_ANGLE); // the 8 cardinals/ordinals with bearings
  const R = 52;
  return (
    <svg viewBox="0 0 120 120" className="pc-svg" role="img" aria-label={`The ${litCode} corner, lit`}>
      <circle cx="60" cy="60" r={R + 3} fill="none" stroke={colorDeep} strokeWidth="0.7" opacity="0.5" />
      {codes.map((code) => {
        const bearing = DIRECTION_ANGLE[code];
        const a0 = bearing - 22.5, a1 = bearing + 22.5;
        const [x0, y0] = P(a0, R), [x1, y1] = P(a1, R);
        const lit = code === litCode;
        return (
          <path
            key={code}
            d={`M60 60 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
            fill={lit ? color : "transparent"}
            stroke={lit ? colorDeep : "#D9CBAE"}
            strokeWidth={lit ? 1 : 0.6}
            opacity={lit ? 0.92 : 0.55}
            className={lit ? "pc-lit" : "pc-wedge"}
          />
        );
      })}
      <circle cx="60" cy="60" r="13" fill="#FBF3E1" stroke={colorDeep} strokeWidth="0.7" />
      <text x="60" y="61" textAnchor="middle" dominantBaseline="central" className="pc-om"
        fontFamily="'Noto Serif Devanagari','Nirmala UI',serif" fill={colorDeep}>ॐ</text>
    </svg>
  );
}

/** Headless Shopify product page — same product.css, sourced from Shopify. */
async function renderShopifyProduct(slug: string) {
  const p = await getShopifyProduct(slug).catch(() => null);
  if (!p) notFound();
  const rootStyle = { ["--pc" as string]: p.color, ["--pc-deep" as string]: p.colorDeep } as React.CSSProperties;
  const low = p.inStock && p.stockQuantity > 0 && p.stockQuantity <= 3;
  const sections = [
    { id: "overview", label: "Overview" },
    { id: "placement", label: "Placement" },
    { id: "composition", label: "Composition" },
    { id: "story", label: "The story" },
  ];
  return (
    <div className="pdp-root" style={rootStyle}>
      <PieceDefs />
      <nav className="pdp-crumb" aria-label="Breadcrumb">
        <Link href="/collection">The Collection</Link><span className="sep">›</span>
        <Link href={`/collection?direction=${p.directionCode}`}>{p.directionName}</Link><span className="sep">›</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <ProductSectionNav sections={sections} />

      <section className="pdp-hero">
        <div className="pdp-gallery-col">
          <ProductGallery images={p.images} glyph={p.glyph} metalGrad={p.metalGrad} gemHex={p.gemHex} name={p.name} />
        </div>
        <aside className="pdp-buy">
          <span className="pdp-eyebrow">
            <span className="sa-deva">{p.directionDeva}</span> {p.directionDeity} · {p.directionIast}
            <span className="pdp-eyebrow-dir">{p.directionName} corner</span>
          </span>
          <h1 className="pdp-title serif">{p.name}</h1>
          <p className="pdp-lede">{p.positioningLine}</p>
          <div className="pdp-price-row">
            <span className="pdp-price">{p.priceDisplay}</span>
            <span className={`pdp-stock${!p.inStock ? " sold" : low ? " low" : ""}`}>
              <span className="dot" />{!p.inStock ? "Made to order" : low ? `Only ${p.stockQuantity} ready to ship` : "In stock"}
            </span>
          </div>
          <div className="pdp-actions">
            <AddToCart productId={p.productId} variantId={p.variantId} pieceName={p.name} inStock={p.inStock} />
            <WishlistHeart slug={p.slug} pieceName={p.name} />
          </div>
          <div className="pdp-assure">
            <span>✦ Certified metal &amp; stone</span><span>⤿ 7-day easy returns</span>
            <span>❋ Handcrafted to order</span><span>◈ Free shipping over ₹15,000</span>
          </div>
          <a href="#placement" className="pdp-jump">Where does it belong? See placement ↓</a>
        </aside>
      </section>

      <div className="pdp-trust bleed">
        <div className="pdp-trust-in">
          <span><b>Certified</b> metal &amp; gemstone</span><span><b>Placement guide</b> in every box</span>
          <span><b>7-day</b> easy returns</span><span><b>Handcrafted</b> to order by artisans</span>
        </div>
      </div>

      <section id="overview" className="pdp-section pdp-highlights">
        <h2 className="pdp-h serif">At a glance</h2>
        <ul className="pdp-hl-list">
          <li><span className="pdp-hl-mark" aria-hidden="true" />Made for the {p.directionName} corner — under its guardian {p.directionDeity} ({p.directionDeva}).</li>
          <li><span className="pdp-hl-mark" aria-hidden="true" />{p.positioningLine}</li>
          {p.primaryMetalName && <li><span className="pdp-hl-mark" aria-hidden="true" />{p.primaryMetalName}{p.weightG ? `, ${p.weightG}g` : ""} — certified composition.</li>}
          {p.gemName && <li><span className="pdp-hl-mark" aria-hidden="true" />Set with {p.gemName}.</li>}
          <li><span className="pdp-hl-mark" aria-hidden="true" />Handcrafted to order · ships with a placement guide and certificate.</li>
        </ul>
      </section>

      <section id="placement" className="pdp-place bleed">
        <div className="pdp-place-in">
          <div className="pdp-place-copy">
            <span className="pdp-kicker">Vāstu placement</span>
            <h2 className="pdp-place-title serif">Where it belongs</h2>
            <p className="pdp-place-lead">
              This piece is cast for the <b>{p.directionName}</b> corner — <span className="sa-deva">{p.directionDeva}</span> {p.directionDeity}&rsquo;s quarter, the <span className="sa-deva">{p.directionIast}</span> zone.
            </p>
            {p.placementNote && <p className="pdp-place-micro">{p.placementNote}</p>}
            <div className="pdp-place-cta">
              <Link href="/home-audit" className="pdp-cta-primary">Take the 2-minute home audit →</Link>
              <Link href="/consultation" className="pdp-cta-ghost">Book a placement consult</Link>
            </div>
          </div>
          <div className="pdp-place-compass">
            <PlacementCompass litCode={p.directionCode} color={p.color} colorDeep={p.colorDeep} />
            <span className="pdp-compass-cap">{p.directionName} · {p.directionIast}</span>
          </div>
        </div>
      </section>

      <section id="composition" className="pdp-section pdp-cert-wrap">
        <h2 className="pdp-h serif">Composition &amp; certificate</h2>
        <div className="pdp-cert">
          <div className="pdp-cert-seal" aria-hidden="true"><span className="pcs-ring" /><span className="pcs-mark">✦</span><span className="pcs-text">Certified<br />Composition</span></div>
          <table className="pdp-cert-table"><tbody>
            {p.primaryMetalName && <tr><th>{p.primaryMetalName}</th><td>{p.weightG ? <span className="pct-wt">{p.weightG} g</span> : null}</td></tr>}
            {p.gemName && <tr><th>{p.gemName}</th><td /></tr>}
            <tr><th>Direction</th><td>{p.directionName} · <span className="sa-deva">{p.directionIast}</span></td></tr>
            {p.categoryCode && <tr><th>Category</th><td>{p.categoryCode}</td></tr>}
          </tbody></table>
        </div>
      </section>

      <section id="story" className="pdp-story bleed">
        <div className="pdp-story-in">
          <span className="pdp-kicker light">The story of this piece</span>
          {p.descriptionHtml
            ? <div className="pdp-story-body serif" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} />
            : <p className="pdp-story-body serif">{p.positioningLine}</p>}
          <div className="pdp-story-sign"><span className="pss-om sa-deva" aria-hidden="true">ॐ</span><span>Made by hand · placed with intention · Sarthak Arts</span></div>
        </div>
      </section>

      <section className="pdp-close bleed"><Link href="/collection" className="pdp-back">← Back to the collection</Link></section>
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isShopifyEnabled()) return await renderShopifyProduct(slug);
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      composition: { orderBy: { sortOrder: "asc" }, include: { metal: true, gemstone: true } },
      directions: { include: { direction: true } },
      purposes: { include: { purpose: true } },
      category: true,
      deity: true,
    },
  });
  if (!product || product.status !== "live") notFound();

  const dir = product.directions[0]?.direction;
  const code = dir?.code ?? "center";
  const v = visualFor(code);

  const [currency, reviews, relatedRaw] = await Promise.all([
    resolveDisplayCurrency(),
    prisma.review.findMany({ where: { productId: product.id, status: "published" }, orderBy: { createdAt: "desc" } }),
    dir
      ? prisma.product.findMany({
          where: { status: "live", id: { not: product.id }, directions: { some: { direction: { code } } } },
          include: { category: true, composition: { include: { metal: true, gemstone: true }, orderBy: { sortOrder: "asc" } } },
          take: 4, orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const priceDisplay = formatDisplay(product.basePriceMinor, currency.code, currency.ratePerBase);
  const inStock = (product.stockQuantity ?? 0) > 0;
  const low = inStock && product.stockQuantity <= 3;

  const metalLine = product.composition.find((c) => c.metal);
  const gemLine = product.composition.find((c) => c.gemstone);
  const primaryMetal = metalLine?.metal?.name ?? null;
  const primaryWeight = metalLine?.weightGrams != null ? Number(metalLine.weightGrams) : null;
  const gemName = gemLine?.gemstone?.name ?? null;
  const accent = v.color;
  const accentDeep = v.colorDeep;
  const purposes = product.purposes.map((pp) => pp.purpose.name);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  // Key highlights, built only from real fields.
  const highlights: string[] = [];
  if (dir) highlights.push(`Made for the ${dir.name} corner — under its guardian ${v.deity} (${v.deva}).`);
  highlights.push(product.positioningLine);
  if (primaryMetal) highlights.push(`${primaryMetal}${primaryWeight ? `, ${primaryWeight}g` : ""} — certified composition.`);
  if (gemName) highlights.push(`Set with ${gemName}.`);
  if (purposes.length) highlights.push(`Traditionally kept to invite ${purposes.join(", ").toLowerCase()}.`);
  highlights.push("Handcrafted to order · ships with a placement guide and certificate.");

  const related = relatedRaw.map((r) => ({
    slug: r.slug,
    name: r.name,
    positioningLine: r.positioningLine,
    price: formatDisplay(r.basePriceMinor, currency.code, currency.ratePerBase),
    glyph: glyphForCategory(r.category.code),
    metalGrad: gradForMetal(r.composition.find((c) => c.metal)?.metal?.name),
    gemHex: r.composition.find((c) => c.gemstone)?.gemstone?.accentHex ?? "#B8863E",
  }));

  const rootStyle = { ["--pc" as string]: accent, ["--pc-deep" as string]: accentDeep } as React.CSSProperties;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "placement", label: "Placement" },
    { id: "composition", label: "Composition" },
    { id: "story", label: "The story" },
    { id: "reviews", label: `Reviews${reviews.length ? ` (${reviews.length})` : ""}` },
  ];

  return (
    <div className="pdp-root" style={rootStyle}>
      <PieceDefs />

      {/* Breadcrumb */}
      <nav className="pdp-crumb" aria-label="Breadcrumb">
        <Link href="/collection">The Collection</Link>
        <span className="sep">›</span>
        {dir && (<><Link href={`/collection?direction=${code}`}>{dir.name}</Link><span className="sep">›</span></>)}
        <span aria-current="page">{product.name}</span>
      </nav>

      <ProductSectionNav sections={sections} />

      {/* ── Hero: gallery + sticky buy panel ── */}
      <section className="pdp-hero">
        <div className="pdp-gallery-col">
          <ProductGallery
            images={product.images.filter((i) => !i.url.includes("/placeholder/")).map((i) => ({ url: i.url, alt: i.alt }))}
            glyph={glyphForCategory(product.category.code)}
            metalGrad={gradForMetal(primaryMetal)}
            gemHex={gemLine?.gemstone?.accentHex ?? "#B8863E"}
            name={product.name}
          />
        </div>

        <aside className="pdp-buy">
          <span className="pdp-eyebrow">
            <span className="sa-deva">{v.deva}</span> {v.deity} · {v.iast}
            {dir && <span className="pdp-eyebrow-dir">{dir.name} corner</span>}
          </span>
          <h1 className="pdp-title serif">{product.name}</h1>
          <p className="pdp-lede">{product.positioningLine}</p>

          {avg !== null ? (
            <a href="#reviews" className="pdp-rating">
              <Stars value={avg} /> <b>{avg.toFixed(1)}</b>
              <span className="pdp-rating-n">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
            </a>
          ) : (
            <span className="pdp-rating none"><Stars value={0} /> Be the first to review</span>
          )}

          <div className="pdp-price-row">
            <span className="pdp-price">{priceDisplay}</span>
            <span className={`pdp-stock${!inStock ? " sold" : low ? " low" : ""}`}>
              <span className="dot" />{!inStock ? "Made to order" : low ? `Only ${product.stockQuantity} ready to ship` : "In stock"}
            </span>
          </div>

          {purposes.length > 0 && (
            <div className="pdp-purposes">
              <span className="pdp-purposes-lbl">Invites</span>
              {purposes.map((p) => <span key={p} className="pdp-purpose">{p}</span>)}
            </div>
          )}

          <div className="pdp-actions">
            <AddToCart productId={product.id} pieceName={product.name} inStock={inStock} />
            <WishlistHeart slug={product.slug} pieceName={product.name} />
          </div>

          <div className="pdp-assure">
            <span>✦ Certified metal &amp; stone</span>
            <span>⤿ 7-day easy returns</span>
            <span>❋ Handcrafted to order</span>
            <span>◈ Free shipping over ₹15,000</span>
          </div>
          {product.isFinalSale && <p className="pdp-finalsale">This piece is a final sale — please review placement before ordering.</p>}

          <a href="#placement" className="pdp-jump">Where does it belong? See placement ↓</a>
        </aside>
      </section>

      {/* Trust ribbon */}
      <div className="pdp-trust bleed">
        <div className="pdp-trust-in">
          <span><b>Certified</b> metal &amp; gemstone</span>
          <span><b>Placement guide</b> in every box</span>
          <span><b>7-day</b> easy returns</span>
          <span><b>Handcrafted</b> to order by artisans</span>
        </div>
      </div>

      {/* ── Overview: key highlights ── */}
      <section id="overview" className="pdp-section pdp-highlights">
        <h2 className="pdp-h serif">At a glance</h2>
        <ul className="pdp-hl-list">
          {highlights.map((h, i) => (
            <li key={i}><span className="pdp-hl-mark" aria-hidden="true" />{h}</li>
          ))}
        </ul>
      </section>

      {/* ── Placement shrine (our signature) ── */}
      <section id="placement" className="pdp-place bleed">
        <div className="pdp-place-in">
          <div className="pdp-place-copy">
            <span className="pdp-kicker">Vāstu placement</span>
            <h2 className="pdp-place-title serif">Where it belongs</h2>
            <p className="pdp-place-lead">
              This piece is cast for the <b>{dir?.name ?? "Brahmasthān"}</b> corner
              {dir ? <> — <span className="sa-deva">{v.deva}</span> {v.deity}&rsquo;s quarter, the <span className="sa-deva">{v.iast}</span> zone.</> : "."}
            </p>
            <div className="pdp-place-facts">
              {dir?.element && <span className="ppf"><span className="ppf-k">Element</span>{dir.element}</span>}
              {dir?.governs && <span className="ppf"><span className="ppf-k">Governs</span>{dir.governs}</span>}
              <span className="ppf"><span className="ppf-k">Guardian</span>{v.deity} <span className="sa-deva">{v.deva}</span></span>
            </div>
            {dir?.microcopy && <p className="pdp-place-micro">{dir.microcopy}</p>}
            {product.deity && (
              <div className="pdp-deity">
                <span className="pdp-deity-name">This piece honours {product.deity.name}</span>
                <p>{product.deity.placementGuidance}</p>
              </div>
            )}
            <div className="pdp-place-cta">
              <Link href="/home-audit" className="pdp-cta-primary">Take the 2-minute home audit →</Link>
              <Link href="/consultation" className="pdp-cta-ghost">Book a placement consult</Link>
            </div>
          </div>
          <div className="pdp-place-compass">
            <PlacementCompass litCode={code} color={accent} colorDeep={accentDeep} />
            <span className="pdp-compass-cap">{dir?.name ?? "Center"} · {v.iast}</span>
          </div>
        </div>
      </section>

      {/* ── Composition certificate ── */}
      <section id="composition" className="pdp-section pdp-cert-wrap">
        <h2 className="pdp-h serif">Composition &amp; certificate</h2>
        <div className="pdp-cert">
          <div className="pdp-cert-seal" aria-hidden="true">
            <span className="pcs-ring" /><span className="pcs-mark">✦</span>
            <span className="pcs-text">Certified<br />Composition</span>
          </div>
          <table className="pdp-cert-table">
            <tbody>
              {product.composition.map((c) => (
                <tr key={c.id}>
                  <th>{c.metal?.name ?? c.gemstone?.name}{c.label ? ` · ${c.label}` : ""}</th>
                  <td>
                    {c.metal?.puritySpec ? <span className="pct-purity">{c.metal.puritySpec}</span> : null}
                    {c.weightGrams ? <span className="pct-wt">{Number(c.weightGrams)} g</span> : null}
                    {c.gemstoneQty ? <span className="pct-wt">{c.gemstoneQty} set</span> : null}
                  </td>
                </tr>
              ))}
              <tr><th>Direction</th><td>{dir?.name ?? "Center"} · <span className="sa-deva">{v.iast}</span></td></tr>
              <tr><th>Category</th><td>{product.category.name}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Detail accordions */}
        <div className="pdp-details">
          <details>
            <summary>Materials &amp; care</summary>
            <div className="pdp-acc-body">{product.careNote}</div>
          </details>
          <details>
            <summary>What&rsquo;s in the box</summary>
            <div className="pdp-acc-body">{product.includedItems}</div>
          </details>
          <details>
            <summary>Shipping &amp; returns</summary>
            <div className="pdp-acc-body">
              Handcrafted to order and dispatched with a placement guide and certificate of composition.
              Free shipping over ₹15,000. Easy 7-day returns on unused pieces in original packaging.
            </div>
          </details>
        </div>
      </section>

      {/* ── The story ── */}
      <section id="story" className="pdp-story bleed">
        <div className="pdp-story-in">
          <span className="pdp-kicker light">The story of this piece</span>
          <p className="pdp-story-body serif">{product.description}</p>
          <div className="pdp-story-sign">
            <span className="pss-om sa-deva" aria-hidden="true">ॐ</span>
            <span>Made by hand · placed with intention · Sarthak Arts</span>
          </div>
        </div>
      </section>

      {/* ── Pairs with / complete the corner ── */}
      {related.length > 0 && (
        <section className="pdp-section pdp-pairs">
          <h2 className="pdp-h serif">More for the {dir?.name ?? "same"} corner</h2>
          <div className="pdp-pairs-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/collection/${r.slug}`} className="pdp-pair">
                <div className="pdp-pair-stage">
                  <span className="pdp-pair-halo" aria-hidden="true" />
                  <PieceRender glyph={r.glyph} metalGrad={r.metalGrad} gemHex={r.gemHex} className="pdp-pair-obj" />
                </div>
                <span className="pdp-pair-name">{r.name}</span>
                <span className="pdp-pair-line">{r.positioningLine}</span>
                <span className="pdp-pair-price">{r.price}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      <section id="reviews" className="pdp-section pdp-reviews">
        <h2 className="pdp-h serif">What devotees say</h2>
        {reviews.length === 0 ? (
          <p className="pdp-rev-empty">No reviews yet — this piece is waiting for its first home.</p>
        ) : (
          <div className="pdp-rev-wrap">
            <div className="pdp-rev-summary">
              <div className="pdp-rev-avg">
                <span className="pra-num">{avg!.toFixed(1)}</span>
                <Stars value={avg!} />
                <span className="pra-count">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
              </div>
              <div className="pdp-rev-bars">
                {breakdown.map((b) => (
                  <div key={b.star} className="prb-row">
                    <span className="prb-star">{b.star}★</span>
                    <span className="prb-track"><span className="prb-fill" style={{ width: `${b.pct}%` }} /></span>
                    <span className="prb-pct">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <ul className="pdp-rev-list">
              {reviews.map((r) => (
                <li key={r.id} className="pdp-rev">
                  <div className="prv-head">
                    <span className="prv-name">{r.customerName}</span>
                    <Stars value={r.rating} />
                    {r.verifiedPurchase && <span className="prv-verified">✓ Verified purchase</span>}
                  </div>
                  <p className="prv-body">{r.body}</p>
                  {r.sellerReply && (
                    <div className="prv-reply">
                      <span className="prv-reply-who">Sarthak Arts</span>
                      <p>{r.sellerReply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Close */}
      <section className="pdp-close bleed">
        <Link href="/collection" className="pdp-back">← Back to the collection</Link>
      </section>
    </div>
  );
}
