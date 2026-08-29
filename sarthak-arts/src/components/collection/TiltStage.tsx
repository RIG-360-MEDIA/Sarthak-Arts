"use client";
import { useRef } from "react";

/**
 * TiltStage — gives the lit niche a sense of depth you can *feel*. As the cursor
 * moves across the alcove, the whole shrine scene leans toward it and a sliver of
 * candlelight tracks the pointer. It's the endowment effect in miniature: a piece
 * you can turn in the light reads as one you already half-own.
 *
 * Purely presentational — it only writes CSS custom properties (compositor-cheap
 * transforms), and the CSS disables the effect for touch and reduced-motion.
 */
export function TiltStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100 + 50).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100 + 50).toFixed(1)}%`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </div>
  );
}
