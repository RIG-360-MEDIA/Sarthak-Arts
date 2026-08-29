"use client";
import { useEffect, useRef, useState } from "react";

/**
 * SearchLauncher — a magnifier-glass control that opens a full-screen search
 * overlay. Real results are wired later against Shopify Storefront search;
 * for now the overlay renders an honest "type to search" empty state so
 * the entry point exists in the nav without lying about capability.
 */
export function SearchLauncher() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the field once the overlay animates in
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="sa-search-btn"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="sa-search-overlay" role="dialog" aria-modal="true" aria-label="Search the collection">
          <div className="sa-search-inner">
            <div className="sa-search-bar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search pieces, deities, directions, festivals…"
                aria-label="Search"
              />
              <button type="button" className="sa-search-close" onClick={() => setOpen(false)} aria-label="Close search">
                ×
              </button>
            </div>
            <div className="sa-search-hint">
              <p>Live search across the collection is arriving soon.</p>
              <p className="fine">
                For now, browse the collection by direction — the shrine is the fastest way to find what belongs where.
              </p>
              <div className="sa-search-links">
                <a href="/collection">The full collection →</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
