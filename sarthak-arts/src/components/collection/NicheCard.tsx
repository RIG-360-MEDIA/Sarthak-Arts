import Link from "next/link";
import type { PieceCard } from "@/lib/collection";
import { PieceRender } from "./Piece";
import { WishlistHeart } from "@/components/hero/WishlistHeart";
import { QuickView } from "./QuickView";
import { TiltStage } from "./TiltStage";

/**
 * NicheCard — a piece enshrined in an arch-topped temple niche (dome top),
 * colour-coded to its direction. The whole card is a stretched link to the
 * product; the wishlist and add-to-cart sit above it so buttons aren't nested
 * in the anchor. Badges/wishlist live in the body (the domed top would clip
 * corner overlays).
 */
export function NicheCard({ p, compact }: { p: PieceCard; compact?: boolean }) {
  const style = { ["--pc" as string]: p.color, ["--pc-deep" as string]: p.colorDeep } as React.CSSProperties;
  const spec = [p.primaryMetalName, p.weightG != null ? `${p.weightG}g` : null, p.isSample ? "sample" : null]
    .filter(Boolean).join(" · ");

  const low = p.inStock && p.stockQuantity > 0 && p.stockQuantity <= 3;
  const badgeLabel = !p.inStock ? "Sold out" : low ? `Only ${p.stockQuantity} left` : "In stock";
  const badgeClass = !p.inStock ? " sold" : low ? " low" : "";

  return (
    <article className={`niche${compact ? " compact" : ""}`} style={style}>
      <Link href={`/collection/${p.slug}`} className="niche-hit" aria-label={`${p.name} — ${p.directionName}`} />

      <TiltStage className="niche-stage">
        <span className="niche-halo" aria-hidden="true" />
        <div className="niche-persp" aria-hidden="true">
          <div className="niche-scene">
            <svg className="niche-arch" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet">
              <path d="M10 116 V48 Q10 14 50 14 Q90 14 90 48 V116" />
              <path d="M50 14 V5" />
              <circle cx="50" cy="3.4" r="2.3" />
              <line x1="6" y1="116" x2="94" y2="116" />
            </svg>
            <PieceRender glyph={p.glyph} metalGrad={p.metalGrad} gemHex={p.gemHex} className="niche-obj" />
          </div>
        </div>
        <span className="niche-glare" aria-hidden="true" />
        <QuickView p={p} />
      </TiltStage>

      <div className="niche-body">
        <div className="niche-top">
          <span className={`niche-badge${badgeClass}`}><span className="dot" />{badgeLabel}</span>
          <WishlistHeart slug={p.slug} pieceName={p.name} />
        </div>
        <span className="niche-dir">
          <span className="niche-dir-deva sa-deva">{p.directionDeva}</span>
          {p.directionDeity} · {p.directionIast}
        </span>
        <h3 className="niche-name">{p.name}</h3>
        <span className="niche-rule" aria-hidden="true" />
        <p className="niche-place">{p.positioningLine}</p>
        {spec && <div className="niche-spec">{spec}</div>}
        <div className="niche-cert"><span aria-hidden="true">✦</span> Certified · Handcrafted</div>
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
