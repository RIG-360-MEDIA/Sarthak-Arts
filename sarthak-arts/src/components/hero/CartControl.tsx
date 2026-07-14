"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * CartControl — the shopping-bag icon in the nav, with count badge and a
 * hover-triggered mini-preview drawer.
 *
 * v1 scope:
 *  - Server passes the initialCount (source of truth for first paint)
 *  - Hover opens the mini-drawer; leaving closes it after a short delay
 *  - The drawer currently shows a placeholder "your cart is loading" line
 *    with primary CTAs — real line-item render lands when we wire Shopify
 *    Storefront cart at PDP-integration time
 *  - On mobile (touch), a tap navigates directly to /cart (no hover state)
 *  - Empty state shows an honest 'your cart is empty' with a link to the
 *    collection
 */
export function CartControl({ initialCount }: { initialCount: number }) {
  const [count] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
  }, []);

  const openNow = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  const label = count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty";

  return (
    <div className="sa-cart" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link href="/cart" className="sa-cart-btn" aria-label={label} aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* Sanctum-language bag icon — quiet, hand-drawn feel */}
          <path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <span className="sa-cart-count" aria-live="polite" aria-atomic="true" data-empty={count === 0 ? "true" : "false"}>
          {count > 0 ? count : ""}
        </span>
      </Link>

      {open && (
        <div className="sa-cart-mini" role="dialog" aria-label="Cart preview" onMouseEnter={openNow} onMouseLeave={closeSoon}>
          <div className="sa-cart-mini-head">
            <span className="sa-eyebrow">Your cart</span>
            <span className="sa-cart-mini-count">
              {count === 0 ? "empty" : `${count} item${count === 1 ? "" : "s"}`}
            </span>
          </div>

          {count === 0 ? (
            <div className="sa-cart-mini-empty">
              <p>Your cart is quiet. When a piece finds you, it will land here.</p>
              <Link href="/collection" className="sa-link-line">Enter the collection →</Link>
            </div>
          ) : (
            <>
              <div className="sa-cart-mini-body">
                <p>Your items are ready. Open the full cart to review composition and place your order.</p>
              </div>
              <div className="sa-cart-mini-actions">
                <Link href="/cart" className="sa-btn sa-btn-ghost">View cart</Link>
                <Link href="/checkout" className="sa-btn sa-btn-primary">Checkout</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
