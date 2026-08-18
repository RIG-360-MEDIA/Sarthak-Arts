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
export function NicheCard({ p, compact }: { p: PieceCard; compact?: boolean }) {
  const style = { ["--pc" as string]: p.color, ["--pc-deep" as string]: p.colorDeep } as React.CSSProperties;
  const spec = [p.primaryMetalName, p.weightG != null ? `${p.weightG}g` : null, p.isSample ? "sample" : null]
    .filter(Boolean).join(" · ");

  return (
    <article className={`niche${compact ? " compact" : ""}`} style={style}>
      <Link href={`/collection/${p.slug}`} className="niche-hit" aria-label={`${p.name} — ${p.directionName}`} />

      <span className={`niche-badge${p.inStock ? "" : " sold"}`}>
        <span className="dot" />{p.inStock ? "In stock" : "Sold out"}
      </span>
      <WishlistHeart slug={p.slug} pieceName={p.name} />

      <div className="niche-stage">
        <svg className="niche-arch" viewBox="0 0 100 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path d="M8 108 V44 Q8 10 50 10 Q92 10 92 44 V108" />
          <line x1="4" y1="108" x2="96" y2="108" />
        </svg>
        <PieceRender glyph={p.glyph} metalGrad={p.metalGrad} gemHex={p.gemHex} className="niche-obj" />
        <AddToCart productId={p.productId} pieceName={p.name} inStock={p.inStock} />
      </div>

      <div className="niche-body">
        <span className="niche-dir">
          {p.directionDeity} · {p.directionIast}
        </span>
        <h3 className="niche-name">{p.name}</h3>
        {spec && <div className="niche-spec">{spec}</div>}
        <p className="niche-place">{p.positioningLine}</p>
        <div className="niche-foot">
          <span className="niche-price">{p.priceDisplay}</span>
          {p.gemName
            ? <span className="niche-gem"><span className="gdot" style={{ background: p.gemHex }} />{p.gemName}</span>
            : p.isSample ? <span className="niche-sample">sample</span> : null}
        </div>
      </div>
    </article>
  );
}
