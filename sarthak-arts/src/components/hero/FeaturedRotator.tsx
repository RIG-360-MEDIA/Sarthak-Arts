"use client";
import { useEffect, useState } from "react";
import type { FeaturedPiece } from "@/lib/home-featured";
import { Product3D } from "./Product3D";
import { WishlistHeart } from "./WishlistHeart";

const PAGE = 9;
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const formatINR = (minor: number) => `₹${inr.format(Math.round(minor / 100))}`;
const EVERY_MS = 6000;

type Product3DKind = "kalash" | "yantra" | "pyramid";
function kindFor(categoryCode: string): Product3DKind {
  if (categoryCode === "yantra") return "yantra";
  if (categoryCode === "pyramid") return "pyramid";
  return "kalash";
}

/** 3×3 grid of pieces that turns to the next nine every few seconds; a click goes to the piece, browser back returns here. */
export function FeaturedRotator({ pieces }: { pieces: FeaturedPiece[] }) {
  const pages = Math.max(1, Math.ceil(pieces.length / PAGE));
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (pages < 2 || paused) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => { setPage((p) => (p + 1) % pages); setFading(false); }, 350);
    }, EVERY_MS);
    return () => clearInterval(t);
  }, [pages, paused]);

  const shown = pieces.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={`sa-pieces-grid${fading ? " is-fading" : ""}`} aria-live="polite">
        {shown.map((p) => {
          const compBits: string[] = [];
          if (p.primaryMetalName && p.primaryMetalWeightG != null) compBits.push(`${p.primaryMetalName} · ${p.primaryMetalWeightG} g`);
          else if (p.primaryMetalName) compBits.push(p.primaryMetalName);
          if (p.primaryMetalLabel) compBits.push(p.primaryMetalLabel);
          return (
            <a key={p.slug} href={`/collection/${p.slug}`} className="sa-piece">
              <div className="sa-piece-stage">
                <div className="sa-piece-badges">
                  {p.isSample && <span className="sa-piece-badge sample" title="Sample piece — real catalogue arriving">Sample</span>}
                </div>
                <div className="sa-piece-wish"><WishlistHeart slug={p.slug} pieceName={p.name} /></div>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served already optimised (WebP) by /api/images
                  <img src={p.photoUrl} alt={p.name} loading="lazy" decoding="async" className="sa-piece-photo" />
                ) : (
                  <>
                    <Product3D kind={kindFor(p.categoryCode)} />
                    <div className="sa-piece-hint">Live 3D · rotating</div>
                  </>
                )}
              </div>
              <div className="sa-piece-body">
                {p.deityName && <div className="sa-piece-deity">{p.deityName}</div>}
                <div className="sa-piece-name">{p.name}</div>
                {compBits.length > 0 && <div className="sa-piece-comp">{compBits.join(" · ")}</div>}
                <div className="sa-piece-foot">
                  <span className="sa-piece-price">{formatINR(p.priceMinor)}</span>
                  <span className={`sa-piece-stock ${p.stockQuantity > 0 ? "in-stock" : "made-to-order"}`}>
                    {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : "Made-to-order"}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      {pages > 1 && (
        <div className="sa-pieces-dots" role="tablist" aria-label="More pieces">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === page} aria-label={`Pieces ${i * PAGE + 1}–${Math.min(pieces.length, (i + 1) * PAGE)}`} className={i === page ? "on" : ""} onClick={() => setPage(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
