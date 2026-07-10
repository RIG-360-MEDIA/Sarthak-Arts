"use client";

/**
 * DirectionWheel — the shrine as an instrument, not an image.
 *
 * Interaction model:
 *   - The wheel tilts continuously toward your cursor (smoothed 3D tilt),
 *     like a compass responding to your presence
 *   - As the cursor moves around the wheel, the nearest Dikpāla illuminates:
 *     its outer arc glows, its name brightens, and the center caption changes
 *     from "Brahmasthan" to that deity and its dominion
 *   - Click enters that direction's collection
 *   - Reduced motion: no tilt; the highlight (a discrete state) still works
 *
 * Dikpāla positions per Bṛhat Saṃhitā, Ch. 53.
 */

import { useEffect, useRef, useState } from "react";

type Direction = {
  key: string;
  label: string;
  dikpala: string;
  deva: string;
  element: string;
  angle: number; // screen-space degrees: East 0, South 90, West 180, North -90
  labelPos: [number, number];
  dikpalaPos: [number, number];
};

const DIRECTIONS: Direction[] = [
  { key: "north",     label: "North", dikpala: "KUBERA",  deva: "कुबेर",   element: "Wealth · Water",    angle: -90,  labelPos: [200, 30],  dikpalaPos: [200, 47] },
  { key: "northeast", label: "NE",    dikpala: "ĪŚĀNA",   deva: "ईशान",    element: "Clarity · Water",   angle: -45,  labelPos: [335, 68],  dikpalaPos: [335, 83] },
  { key: "east",      label: "East",  dikpala: "INDRA",   deva: "इन्द्र",    element: "Energy · Space",    angle: 0,    labelPos: [378, 205], dikpalaPos: [378, 221] },
  { key: "southeast", label: "SE",    dikpala: "AGNI",    deva: "अग्नि",    element: "Vitality · Fire",   angle: 45,   labelPos: [335, 343], dikpalaPos: [335, 358] },
  { key: "south",     label: "South", dikpala: "YAMA",    deva: "यम",      element: "Dharma · Earth",    angle: 90,   labelPos: [200, 380], dikpalaPos: [200, 363] },
  { key: "southwest", label: "SW",    dikpala: "NIRṚTI",  deva: "निर्ऋति",  element: "Stability · Earth", angle: 135,  labelPos: [65, 343],  dikpalaPos: [65, 358] },
  { key: "west",      label: "West",  dikpala: "VARUṆA",  deva: "वरुण",    element: "Relations · Water", angle: 180,  labelPos: [22, 205],  dikpalaPos: [22, 221] },
  { key: "northwest", label: "NW",    dikpala: "VĀYU",    deva: "वायु",    element: "Movement · Air",    angle: -135, labelPos: [65, 68],   dikpalaPos: [65, 83] },
];

/** Arc path along radius r, centered on `angle`, spanning ±spread degrees. */
function arcPath(cx: number, cy: number, r: number, angle: number, spread: number) {
  const toXY = (a: number): [number, number] => [
    cx + r * Math.cos((a * Math.PI) / 180),
    cy + r * Math.sin((a * Math.PI) / 180),
  ];
  const [x1, y1] = toXY(angle - spread);
  const [x2, y2] = toXY(angle + spread);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function DirectionWheel() {
  const holderRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Direction | null>(null);
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });
  const reducedMotion = useRef(false);

  // Smoothed tilt loop — the wheel leans toward the cursor
  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current) return;
    let raf: number;
    const tick = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.08;
      current.current.ry += (target.current.ry - current.current.ry) * 0.08;
      if (tiltRef.current) {
        tiltRef.current.style.transform =
          `rotateX(${current.current.rx.toFixed(2)}deg) rotateY(${current.current.ry.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const el = holderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 .. 0.5
    const dy = (e.clientY - rect.top) / rect.height - 0.5;

    // Tilt toward the cursor (max ~9°)
    target.current.ry = dx * 18;
    target.current.rx = -dy * 18;

    // Which Dikpāla is the cursor pointing at?
    const dist = Math.hypot(dx, dy); // 0 at center, ~0.7 at corner
    if (dist < 0.09) {
      setHovered(null); // the Brahmasthan — the still center
      return;
    }
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, East 0
    let best = DIRECTIONS[0];
    let bestDelta = 360;
    for (const d of DIRECTIONS) {
      const delta = Math.abs(((angle - d.angle + 540) % 360) - 180);
      if (delta < bestDelta) { bestDelta = delta; best = d; }
    }
    setHovered(best);
  };

  const onLeave = () => {
    setHovered(null);
    target.current.rx = 0;
    target.current.ry = 0;
  };

  const onClick = () => {
    if (hovered) window.location.href = `/direction?zone=${hovered.key}`;
  };

  return (
    <div
      ref={holderRef}
      className={`sa-wheel${hovered ? " is-pointing" : ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="img"
      aria-label="Vastu direction wheel — the eight Dikpālas. Move across the wheel to reveal each guardian; click to enter its direction."
    >
      <div ref={tiltRef} className="sa-wheel-tilt">
        <svg viewBox="0 0 400 400" fill="none">
          {/* Rings */}
          <circle cx="200" cy="200" r="195" stroke="#E8B849" strokeWidth=".8" opacity=".4" />
          <circle cx="200" cy="200" r="160" stroke="#E8B849" strokeWidth=".8" opacity=".55" />
          <circle cx="200" cy="200" r="110" stroke="#E8B849" strokeWidth=".8" opacity=".65" />
          <circle cx="200" cy="200" r="60" stroke="#FCD46F" strokeWidth="1.2" opacity=".85" />
          {/* Spokes */}
          <g stroke="#E8B849" strokeWidth=".6" opacity=".55">
            <line x1="200" y1="5" x2="200" y2="395" />
            <line x1="5" y1="200" x2="395" y2="200" />
            <line x1="62" y1="62" x2="338" y2="338" />
            <line x1="338" y1="62" x2="62" y2="338" />
          </g>
          {/* Śrī Yantra core */}
          <polygon points="200,140 250,240 150,240" stroke="#FCD46F" strokeWidth=".8" fill="none" opacity=".65" />
          <polygon points="200,260 250,160 150,160" stroke="#FCD46F" strokeWidth=".8" fill="none" opacity=".65" />

          {/* Hover arcs — one per direction, only the pointed one glows */}
          {DIRECTIONS.map((d) => (
            <path
              key={`arc-${d.key}`}
              d={arcPath(200, 200, 186, d.angle, 20)}
              stroke="#FCD46F"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              style={{
                opacity: hovered?.key === d.key ? 0.95 : 0,
                transition: "opacity .35s ease",
                filter: "drop-shadow(0 0 6px rgba(252,212,111,.8))",
              }}
            />
          ))}

          {/* Direction + Dikpāla labels */}
          {DIRECTIONS.map((d) => {
            const active = hovered?.key === d.key;
            const cardinal = ["north", "south", "east", "west"].includes(d.key);
            return (
              <g
                key={d.key}
                style={{ opacity: hovered && !active ? 0.4 : 1, transition: "opacity .35s ease" }}
              >
                <text
                  x={d.labelPos[0]} y={d.labelPos[1]} textAnchor="middle"
                  fontFamily="Georgia, serif" fontSize={cardinal ? 14 : 11}
                  fill={active ? "#FCD46F" : cardinal ? "#F7ECD4" : "#FCD46F"}
                  style={{ transition: "fill .35s ease" }}
                >
                  {d.label}
                </text>
                <text
                  x={d.dikpalaPos[0]} y={d.dikpalaPos[1]} textAnchor="middle"
                  fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="600"
                  letterSpacing="1.4"
                  fill={active ? "#FCD46F" : "rgba(232,184,73,.9)"}
                  style={{ transition: "fill .35s ease" }}
                >
                  {d.dikpala}
                </text>
              </g>
            );
          })}

          <circle cx="200" cy="200" r="5" fill="#FCD46F" opacity=".95" />
        </svg>

        {/* Center caption — the Brahmasthan, or the Dikpāla you're pointing at */}
        <div className="sa-wheel-center" aria-live="polite">
          {hovered ? (
            <>
              <span className="sa-wheel-deva" lang="sa">{hovered.deva}</span>
              <span className="sa-wheel-name">{hovered.dikpala}</span>
              <span className="sa-wheel-elm">{hovered.element}</span>
              <span className="sa-wheel-enter">Click to enter →</span>
            </>
          ) : (
            <>
              <span className="sa-wheel-om" lang="sa">ॐ</span>
              <span className="sa-wheel-brahma">Brahmasthan</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
