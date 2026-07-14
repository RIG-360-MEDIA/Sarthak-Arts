"use client";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";

/**
 * Wishlist heart — a small save-for-later control on each product card.
 * State lives in localStorage as a Set<slug> keyed under "sa_wishlist".
 * When the visitor later signs in (Shopify customer account, future),
 * we'll merge the local set into their account.
 *
 * Not authoritative — this is a guest-only view; the source of truth
 * comes back when accounts land.
 */

const KEY = "sa_wishlist";
const EVT = "sa:wishlist:change";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  window.localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function WishlistHeart({ slug, pieceName }: { slug: string; pieceName: string }) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const push = useToast();

  useEffect(() => {
    setMounted(true);
    const sync = () => setSaved(readSet().has(slug));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  const toggle = (e: React.MouseEvent) => {
    // Don't let the card's parent <a> navigate when the heart is clicked
    e.preventDefault();
    e.stopPropagation();
    const set = readSet();
    if (set.has(slug)) {
      set.delete(slug);
      writeSet(set);
      push({ tone: "warn", message: `Removed ${pieceName} from your saved pieces.` });
    } else {
      set.add(slug);
      writeSet(set);
      push({ tone: "ok", message: `Saved ${pieceName} to your saved pieces.` });
    }
  };

  return (
    <button
      type="button"
      className={`sa-wish${saved ? " is-saved" : ""}`}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${pieceName} from saved pieces` : `Save ${pieceName} for later`}
      title={saved ? "Saved" : "Save for later"}
      // Prevent hydration flash by only rendering the "saved" state after mount
      data-mounted={mounted ? "true" : "false"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9C.8 8.7 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.7 3.7 4 7-2.5 4.5-9.5 9-9.5 9z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
