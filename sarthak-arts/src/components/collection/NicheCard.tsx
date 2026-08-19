import Link from "next/link";
import type { PieceCard } from "@/lib/collection";
import { PieceRender } from "./Piece";
import { WishlistHeart } from "@/components/hero/WishlistHeart";
import { AddToCart } from "./AddToCart";

/**
 * NicheCard — a piece framed in a toraṇa (shrine niche), colour-coded to its
 * direction. The whole card is a stretched link to the product; the wishlist
 * heart and add-to-cart sit above it (so buttons aren't nested in the anchor).
 */
export function NicheCard({ p, compact, feature }: { p: PieceCard; compact?: boolean; feature?: boolean }) {
  const style = { ["--pc" as string]: p.color, ["--pc-deep" as string]: p.colorDeep } as React.CSSProperties;
  const spec = [p.primaryMetalName, p.weightG != null ? `${p.weightG}g` : null, p.isSample ? "sample" : null]
    .filter(Boolean).join(" · ");

  return (
    <article className={`niche${compact ? " compact" : ""}${feature ? " feature" : ""}`} style={style}>
      <Link href={`/collection/${p.slug}`} className="niche-hit" aria-label={`${p.name} — ${p.directionName}`} />

      <span className={`niche-badge${p.inStock ? "" : " sold"}`}>
        <span className="dot" />{p.inStock ? "In stock" : "Sold out"}
      </span>
      <WishlistHeart slug={p.slug} pieceName={p.name} />

      <div className="niche-stage">
        <span className="niche-halo" aria-hidden="true" />
        <svg className="niche-arch" viewBox="0 0 100 118" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path d="M9 114 V46 Q9 13 50 13 Q91 13 91 46 V114" />
          <path d="M50 13 V5" />
          <circle cx="50" cy="3.4" r="2.3" />
          <line x1="5" y1="114" x2="95" y2="114" />
        </svg>
        <PieceRender glyph={p.glyph} metalGrad={p.metalGrad} gemHex={p.gemHex} className="niche-obj" />
        <AddToCart productId={p.productId} pieceName={p.name} inStock={p.inStock} />
      </div>

      <div className="niche-body">
        <span className="niche-dir">
          <span className="niche-dir-deva sa-deva">{p.directionDeva}</span>
          {p.directionDeity} · {p.directionIast}
        </span>
        <h3 className="niche-name">{p.name}</h3>
        <span className="niche-rule" aria-hidden="true" />
        <p className="niche-place">{p.positioningLine}</p>
        {spec && <div className="niche-spec">{spec}</div>}
        <div className="niche-foot">
          <span className="niche-price">{p.priceDisplay}</span>
          {p.gemName
            ? <span className="niche-gem"><span className="gem" style={{ ["--gem" as string]: p.gemHex } as React.CSSProperties} />{p.gemName}</span>
            : p.isSample ? <span className="niche-sample">sample</span> : null}
        </div>
      </div>
    </article>
  );
}
