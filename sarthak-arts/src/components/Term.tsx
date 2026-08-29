"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTerm } from "@/lib/glossary";

/**
 * Term — wraps a devotional/Sanskrit word with a plain-language tooltip.
 *
 * Interaction:
 *  - hover (desktop) shows a preview; moving onto the card keeps it open
 *  - click / tap PINS it open so the "Learn more" link is easy to reach
 *  - click the term again, click anywhere outside, or press Escape to close
 *
 * The card is rendered in a portal so it's never clipped by the hero/pill, and
 * the close-on-outside-click explicitly ignores clicks on the card itself
 * (that was the bug that made "Learn more" un-clickable).
 *
 * If the term isn't in the glossary it renders plain text — safe anywhere.
 */
export function Term({ name, children }: { name: string; children?: React.ReactNode }) {
  const entry = getTerm(name);
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cancelHide = useCallback(() => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } }, []);
  const show = useCallback(() => {
    cancelHide();
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      // Clamp x so the (centred) card never spills past the screen edge on mobile.
      const vw = document.documentElement.clientWidth;
      const half = Math.min(130, vw * 0.46) + 8;
      const x = Math.max(half, Math.min(r.left + r.width / 2, vw - half));
      setCoords({ x, y: r.top });
    }
    setOpen(true);
  }, [cancelHide]);
  const scheduleHide = useCallback(() => {
    if (pinned) return; // stay open once pinned by a click
    cancelHide();
    hideTimer.current = setTimeout(() => setOpen(false), 140);
  }, [pinned, cancelHide]);

  useEffect(() => {
    if (!open) return;
    const doClose = () => { cancelHide(); setPinned(false); setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") doClose(); };
    const onMove = () => doClose(); // scroll/resize invalidates the anchored position
    const onDown = (e: Event) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || popRef.current?.contains(t)) return; // ignore the term & the card
      doClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, cancelHide]);

  if (!entry) return <>{children ?? name}</>;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`sa-term${open ? " is-open" : ""}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
        onClick={(e) => { e.preventDefault(); if (pinned) { cancelHide(); setPinned(false); setOpen(false); } else { setPinned(true); show(); } }}
      >
        {children ?? entry.term}
      </button>

      {mounted && open && coords && createPortal(
        <span
          ref={popRef}
          id={id}
          role="tooltip"
          className="sa-term-pop"
          style={{ left: coords.x, top: coords.y - 10 }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <span className="sa-term-pop-h"><b>{entry.term}</b>{entry.deva ? <em lang="sa"> · {entry.deva}</em> : null}</span>
          <span className="sa-term-pop-d">{entry.short}</span>
          <a className="sa-term-pop-more" href={`/glossary#${name.toLowerCase()}`}>Learn more →</a>
        </span>,
        document.body,
      )}
    </>
  );
}
