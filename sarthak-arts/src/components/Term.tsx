"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTerm } from "@/lib/glossary";

/**
 * Term — wraps a devotional/Sanskrit word with a gentle plain-language tooltip.
 * Works on hover (desktop), tap (mobile) and keyboard focus; the popover is
 * rendered in a portal so it's never clipped by the hero or panchang pill, and
 * stays open while the pointer is over it so "Learn more" stays clickable.
 *
 * If the term isn't in the glossary it simply renders its text — safe anywhere.
 */
export function Term({ name, children }: { name: string; children?: React.ReactNode }) {
  const entry = getTerm(name);
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cancelHide = useCallback(() => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } }, []);
  const show = useCallback(() => {
    cancelHide();
    const r = ref.current?.getBoundingClientRect();
    if (r) setCoords({ x: r.left + r.width / 2, y: r.top });
    setOpen(true);
  }, [cancelHide]);
  const scheduleHide = useCallback(() => { cancelHide(); hideTimer.current = setTimeout(() => setOpen(false), 120); }, [cancelHide]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => setOpen(false); // scroll/resize invalidates the position
    const onDown = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
  }, [open]);

  if (!entry) return <>{children ?? name}</>;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="sa-term"
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
        onClick={(e) => { e.preventDefault(); open ? setOpen(false) : show(); }}
      >
        {children ?? entry.term}
      </button>

      {mounted && open && coords && createPortal(
        <span
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
