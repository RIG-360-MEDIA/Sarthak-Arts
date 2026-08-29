"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { PieceCard } from "@/lib/collection";
import { PieceRender } from "./Piece";
import { AddToCart } from "./AddToCart";
import { WishlistHeart } from "@/components/hero/WishlistHeart";

/**
 * QuickView — inspect a piece in an overlay without leaving the grid. Reduces
 * friction for a considered purchase: composition, placement, price and
 * add-to-cart are all one click away, with a link through to the full page.
 * Rendered via a portal so a hovered/transformed card never clips the modal.
 */
export function QuickView({ p }: { p: PieceCard }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const launch = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setOpen(true); };

  const spec = [p.primaryMetalName, p.weightG != null ? `${p.weightG}g` : null, p.gemName]
    .filter(Boolean).join(" · ");
  const low = p.inStock && p.stockQuantity > 0 && p.stockQuantity <= 3;
  const stockLabel = !p.inStock ? "Sold out" : low ? `Only ${p.stockQuantity} left` : "In stock";

  return (
    <>
      <button type="button" className="niche-quick" onClick={launch} aria-haspopup="dialog">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Quick view
      </button>

      {mounted && open && createPortal(
        <div className="qv-overlay" role="dialog" aria-modal="true" aria-label={`${p.name}, quick view`} onClick={() => setOpen(false)}>
          <div
            className="qv-modal"
            style={{ ["--pc" as string]: p.color, ["--pc-deep" as string]: p.colorDeep } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="qv-close" onClick={() => setOpen(false)} aria-label="Close quick view">✕</button>
            <div className="qv-stage">
              <span className="qv-halo" aria-hidden="true" />
              <PieceRender glyph={p.glyph} metalGrad={p.metalGrad} gemHex={p.gemHex} className="qv-obj" />
            </div>
            <div className="qv-info">
              <span className="qv-dir">
                <span className="sa-deva">{p.directionDeva}</span> {p.directionDeity} · {p.directionIast}
              </span>
              <h3 className="qv-name serif">{p.name}</h3>
              <div className="qv-price-row">
                <span className="qv-price">{p.priceDisplay}</span>
                <span className={`qv-stock${!p.inStock ? " sold" : low ? " low" : ""}`}>{stockLabel}</span>
              </div>
              <p className="qv-place">{p.positioningLine}</p>
              {spec && <div className="qv-spec">{spec}</div>}
              <div className="qv-trust">✦ Certified metal &amp; gemstone · Handcrafted to order</div>
              <div className="qv-actions">
                <AddToCart productId={p.productId} variantId={p.variantId} pieceName={p.name} inStock={p.inStock} />
                <WishlistHeart slug={p.slug} pieceName={p.name} />
              </div>
              <Link href={`/collection/${p.slug}`} className="qv-details" onClick={() => setOpen(false)}>
                View full details →
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
