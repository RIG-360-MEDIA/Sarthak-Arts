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
};

const DIRECTIONS: Direction[] = [
  { key: "north",     label: "North", dikpala: "KUBERA",  deva: "कुबेर",   element: "Wealth · Water",    angle: -90 },
  { key: "northeast", label: "NE",    dikpala: "ĪŚĀNA",   deva: "ईशान",    element: "Clarity · Water",   angle: -45 },
  { key: "east",      label: "East",  dikpala: "INDRA",   deva: "इन्द्र",    element: "Energy · Space",    angle: 0 },
  { key: "southeast", label: "SE",    dikpala: "AGNI",    deva: "अग्नि",    element: "Vitality · Fire",   angle: 45 },
  { key: "south",     label: "South", dikpala: "YAMA",    deva: "यम",      element: "Dharma · Earth",    angle: 90 },
  { key: "southwest", label: "SW",    dikpala: "NIRṚTI",  deva: "निर्ऋति",  element: "Stability · Earth", angle: 135 },
  { key: "west",      label: "West",  dikpala: "VARUṆA",  deva: "वरुण",    element: "Relations · Water", angle: 180 },
  { key: "northwest", label: "NW",    dikpala: "VĀYU",    deva: "वायु",    element: "Movement · Air",    angle: -135 },
];

/* Every piece of text and line-work is computed from its angle, so nothing
   collides: labels center in the outer band (between the two outer rings),
   Dikpāla names sit clear inside the middle ring, spokes stop before the
   band, and the hover arc hugs the rim above everything. */
const CX = 200, CY = 200;
const R_OUTER = 195;   // outer ring
const R_MID = 160;     // middle ring — inner edge of the label band
const R_INNER = 66;    // caption circle
const R_LABEL = 177;   // direction names, centered in the band
const R_DIKPALA = 141; // guardian names, clear of the middle ring
const R_ARC = 189;     // hover arc, just inside the rim
const R_SPOKE_IN = 72;   // spokes: from outside the caption circle…
const R_SPOKE_OUT = 120; // …stopping well before the Dikpāla names at R_DIKPALA

function pt(angle: number, r: number): [number, number] {
  return [
    CX + r * Math.cos((angle * Math.PI) / 180),
    CY + r * Math.sin((angle * Math.PI) / 180),
  ];
}

/** Arc path along radius r, centered on `angle`, spanning ±spread degrees. */
function arcPath(r: number, angle: number, spread: number) {
  const [x1, y1] = pt(angle - spread, r);
  const [x2, y2] = pt(angle + spread, r);
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

  const enter = (key: string) => {
    window.location.href = `/collection?direction=${key}`;
  };
  const onClick = () => {
    if (hovered) enter(hovered.key);
  };
  // Keyboard: if a direction is currently highlighted (via hover) Enter/Space
  // navigates to it. Otherwise the wheel is a link to the index.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hovered) enter(hovered.key);
      else window.location.href = "/collection";
    }
  };

  return (
    <div
      ref={holderRef}
      className={`sa-wheel${hovered ? " is-pointing" : ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Vastu direction wheel — the eight Dikpālas. Move across the wheel to reveal each guardian; click to enter its direction. Press Enter to open the full index."
    >
      <div ref={tiltRef} className="sa-wheel-tilt">
        <svg viewBox="0 0 400 400" fill="none">
          {/* Rings — a clean compass; the Śrī Yantra lives in the scene behind,
              not repeated here */}
          <circle cx={CX} cy={CY} r={R_OUTER} stroke="#E8B849" strokeWidth=".8" opacity=".35" />
          <circle cx={CX} cy={CY} r={R_MID} stroke="#E8B849" strokeWidth=".8" opacity=".45" />
          <circle cx={CX} cy={CY} r={R_INNER} stroke="#FCD46F" strokeWidth="1.1" opacity=".8" />

          {/* Spokes — whispered, stopping short of the caption circle and the
              label band so no line ever runs under text */}
          <g stroke="#E8B849" strokeWidth=".5" opacity=".3">
            {DIRECTIONS.map((d) => {
              // The horizontal axis has the least room for horizontal text —
              // East/West spokes stop earlier so VARUṆA and INDRA sit clear.
              const horizontal = d.angle % 180 === 0;
              const [x1, y1] = pt(d.angle, R_SPOKE_IN);
              const [x2, y2] = pt(d.angle, horizontal ? 104 : R_SPOKE_OUT);
              return <line key={`spoke-${d.key}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>

          {/* Hover arcs — hugging the rim, above the label band */}
          {DIRECTIONS.map((d) => (
            <path
              key={`arc-${d.key}`}
              d={arcPath(R_ARC, d.angle, 18)}
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

          {/* Direction + Dikpāla labels — positions computed from angle:
              direction name centered in the outer band, guardian name
              inside the middle ring, both vertically centered */}
          {DIRECTIONS.map((d) => {
            const active = hovered?.key === d.key;
            const cardinal = ["north", "south", "east", "west"].includes(d.key);
            const [lx, ly] = pt(d.angle, R_LABEL);
            const [dx, dy] = pt(d.angle, d.angle % 180 === 0 ? 134 : R_DIKPALA);
            return (
              <g
                key={d.key}
                style={{ opacity: hovered && !active ? 0.4 : 1, transition: "opacity .35s ease" }}
              >
                <text
                  x={lx.toFixed(1)} y={ly.toFixed(1)}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="Georgia, serif" fontSize={cardinal ? 13.5 : 11}
                  fill={active ? "#FCD46F" : cardinal ? "#F7ECD4" : "#FCD46F"}
                  style={{ transition: "fill .35s ease" }}
                >
                  {d.label}
                </text>
                <text
                  x={dx.toFixed(1)} y={dy.toFixed(1)}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600"
                  letterSpacing="1.2"
                  fill={active ? "#FCD46F" : "rgba(232,184,73,.85)"}
                  style={{ transition: "fill .35s ease" }}
                >
                  {d.dikpala}
                </text>
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r="4" fill="#FCD46F" opacity=".9" />
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
