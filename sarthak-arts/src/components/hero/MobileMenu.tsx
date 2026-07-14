"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * MobileMenu — the ☰ hamburger and its right-side slide-in drawer.
 * Only visible below 760px width (CSS-driven display).
 *
 * Contents:
 *  - All primary nav links
 *  - Cart shortcut
 *  - Panchang one-liner (server-passed summary)
 *  - "Enter the shrine" primary CTA
 *
 * Interaction:
 *  - Tap ☰ opens; tap the backdrop, the × button, or Escape closes
 *  - Body scroll locked while open
 *  - First focusable element receives focus on open
 */
type Props = { initialCartCount: number; panchangSummary: string | null };

export function MobileMenu({ initialCartCount, panchangSummary }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="sa-burger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="sa-drawer-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="sa-drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="sa-drawer-head">
              <Link href="/labs/hero" className="sa-drawer-logo" onClick={() => setOpen(false)}>
                <span className="om" aria-hidden="true">ॐ</span> Sarthak Arts
              </Link>
              <button
                type="button"
                className="sa-drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {panchangSummary && (
              <div className="sa-drawer-panchang">
                <span className="sa-eyebrow">Now</span>
                <div>{panchangSummary}</div>
              </div>
            )}

            <nav className="sa-drawer-links" aria-label="Menu">
              <Link href="/collection" onClick={() => setOpen(false)}>The Collection</Link>
              <Link href="/labs/direction" onClick={() => setOpen(false)}>Shop by Direction</Link>
              <Link href="/consultation" onClick={() => setOpen(false)}>Consultations</Link>
              <Link href="/vastu-shastra" onClick={() => setOpen(false)}>Journal</Link>
              <Link href="/home-audit" onClick={() => setOpen(false)}>The two-minute audit</Link>
            </nav>

            <div className="sa-drawer-cart">
              <Link href="/cart" onClick={() => setOpen(false)}>
                Cart
                <span>{initialCartCount > 0 ? `${initialCartCount} item${initialCartCount === 1 ? "" : "s"}` : "empty"}</span>
              </Link>
            </div>

            <div className="sa-drawer-cta">
              <Link href="/labs/direction" className="sa-btn sa-btn-primary" onClick={() => setOpen(false)}>
                Enter the shrine
              </Link>
            </div>

            <div className="sa-drawer-foot">
              <a href="/about">About</a>
              <span>·</span>
              <a href="/our-craft">Our craft</a>
              <span>·</span>
              <a href="/order-lookup">Order lookup</a>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
