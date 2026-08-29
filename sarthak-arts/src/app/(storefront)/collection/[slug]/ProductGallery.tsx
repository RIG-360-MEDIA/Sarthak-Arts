"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { PieceRender } from "@/components/collection/Piece";

type Img = { url: string; alt: string };

/**
 * ProductGallery — the piece enshrined in a candlelit alcove. When real
 * photographs exist they drive the stage and a thumbnail rail (with a zoom
 * lightbox); until they arrive, the metallic render stands in gracefully in the
 * same lit niche, so the page never looks unfinished. The direction's colour
 * lights the halo behind the piece.
 */
export function ProductGallery({
  images, glyph, metalGrad, gemHex, name,
}: {
  images: Img[];
  glyph: string; metalGrad: string; gemHex: string;
  name: string;
}) {
  const has = images.length > 0;
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoom(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [zoom]);

  const current = images[active];

  return (
    <div className="pg">
      <div
        className={`pg-stage${has ? " zoomable" : ""}`}
        onClick={() => has && setZoom(true)}
        role={has ? "button" : undefined}
        aria-label={has ? "Open full view" : undefined}
      >
        <span className="pg-halo" aria-hidden="true" />
        <svg className="pg-arch" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path d="M10 116 V48 Q10 14 50 14 Q90 14 90 48 V116" />
          <path d="M50 14 V5" />
          <circle cx="50" cy="3.4" r="2.3" />
          <line x1="6" y1="116" x2="94" y2="116" />
        </svg>
        {has ? (
          <Image
            src={current.url} alt={current.alt || name}
            width={720} height={720} unoptimized className="pg-photo"
          />
        ) : (
          <PieceRender glyph={glyph} metalGrad={metalGrad} gemHex={gemHex} className="pg-obj" />
        )}
        {has && <span className="pg-zoomhint">⤢ Click to see full view</span>}
      </div>

      {has && images.length > 1 && (
        <div className="pg-thumbs" role="tablist" aria-label="Product images">
          {images.map((im, i) => (
            <button
              key={im.url + i} type="button" role="tab" aria-selected={i === active}
              className={`pg-thumb${i === active ? " on" : ""}`} onClick={() => setActive(i)}
            >
              <Image src={im.url} alt={im.alt || `${name} view ${i + 1}`} width={92} height={92} unoptimized />
            </button>
          ))}
        </div>
      )}

      {!has && (
        <p className="pg-note">Photography of this piece is being prepared. The rendering shows its form and finish.</p>
      )}

      {mounted && zoom && current && createPortal(
        <div className="pg-lightbox" role="dialog" aria-modal="true" aria-label={`${name}, full view`} onClick={() => setZoom(false)}>
          <button type="button" className="pg-lb-close" aria-label="Close" onClick={() => setZoom(false)}>✕</button>
          <Image
            src={current.url} alt={current.alt || name}
            width={1400} height={1400} unoptimized className="pg-lb-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
