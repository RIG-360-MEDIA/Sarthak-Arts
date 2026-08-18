"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toQuery, toggleDirection } from "@/lib/collection-url";

/** Structural subset of a direction this compass needs (superset from the server is fine). */
type CompassDir = {
  code: string; name: string; iast: string; deity: string; deva: string;
  governs: string; color: string; colorDeep: string; angle: number;
};

/**
 * CollectionCompass — the engraved colour-wheel in the filter rail. Eight petals
 * (the Aṣṭadikpāla) around the Brahmasthān; tapping a petal toggles that
 * direction in the URL (multi-select), the needle turns to the active zone, and
 * the caption reads out the direction's Sanskrit name, guardian, and dominion.
 */

const CX = 100, CY = 100, R_IN = 42, R_OUT = 95, R_LABEL = 68, SPREAD = 21;

function pt(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}
function wedge(a: number): string {
  const [x1i, y1i] = pt(R_IN, a - SPREAD);
  const [x1o, y1o] = pt(R_OUT, a - SPREAD);
  const [x2o, y2o] = pt(R_OUT, a + SPREAD);
  const [x2i, y2i] = pt(R_IN, a + SPREAD);
  return `M${x1i.toFixed(1)} ${y1i.toFixed(1)} L${x1o.toFixed(1)} ${y1o.toFixed(1)} A${R_OUT} ${R_OUT} 0 0 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)} L${x2i.toFixed(1)} ${y2i.toFixed(1)} A${R_IN} ${R_IN} 0 0 0 ${x1i.toFixed(1)} ${y1i.toFixed(1)} Z`;
}

export function CollectionCompass({
  directions, selected, baseParams,
}: {
  directions: CompassDir[];
  selected: string[];
  baseParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const petals = directions.filter((d) => d.code !== "center");
  const center = directions.find((d) => d.code === "center");

  const go = (code: string) => {
    const next = toggleDirection(selected, code);
    router.push(toQuery({ ...baseParams, direction: next.join(",") || undefined }), { scroll: false });
  };

  // Caption: the hovered petal, else the single active one, else the Brahmasthān.
  const activeCode = hover ?? (selected.length === 1 ? selected[0] : null);
  const active = directions.find((d) => d.code === activeCode) ?? null;
  // Needle points at the active/first-selected zone, else north.
  const needleAngle = (active && active.code !== "center" ? active.angle : (petals.find((p) => p.code === selected[0])?.angle ?? -90));

  return (
    <>
      <div className="compass-holder">
        <svg className="compass" viewBox="0 0 200 200" role="group" aria-label="Filter by direction — the eight guardians">
          <circle cx={CX} cy={CY} r={R_OUT + 2} fill="none" stroke="var(--line)" strokeWidth="1" />
          {petals.map((d) => {
            const on = selected.includes(d.code);
            const dim = selected.length > 0 && !on && hover !== d.code;
            const [lx, ly] = pt(R_LABEL, d.angle);
            const style = { ["--pc" as string]: d.color } as React.CSSProperties;
            return (
              <g
                key={d.code}
                className={`petal${dim ? " dim" : ""}`}
                style={style}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${d.name} — ${d.iast}, ${d.deity}. ${d.governs}`}
                onClick={() => go(d.code)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(d.code); } }}
                onMouseEnter={() => setHover(d.code)}
                onMouseLeave={() => setHover((h) => (h === d.code ? null : h))}
                onFocus={() => setHover(d.code)}
                onBlur={() => setHover((h) => (h === d.code ? null : h))}
              >
                <path d={wedge(d.angle)} fill={d.color} fillOpacity={on ? 0.9 : 0.24} stroke={d.colorDeep} strokeWidth={on ? 1.4 : 0.6} />
                <text className="plabel" x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={on ? "#fff" : d.colorDeep}>
                  {d.name.replace("North", "N").replace("South", "S").replace("east", "E").replace("west", "W").replace("-", "")}
                </text>
              </g>
            );
          })}
          {/* needle */}
          <g className="needle" style={{ transform: `rotate(${needleAngle + 90}deg)` }}>
            <path d={`M${CX} ${CY - R_IN + 4} L${CX - 4} ${CY} L${CX + 4} ${CY} Z`} fill="var(--gold-deep)" />
          </g>
          <circle cx={CX} cy={CY} r={R_IN - 4} fill="#fff" stroke="var(--line)" strokeWidth="1" />
          <text className="om sa-deva" x={CX} y={CY - 3} textAnchor="middle" dominantBaseline="central" aria-hidden="true">ॐ</text>
          <text className="cap" x={CX} y={CY + 12} textAnchor="middle">{center ? "BRAHMA" : ""}</text>
        </svg>
      </div>

      <div className="fmeta" style={active ? ({ ["--pc-deep" as string]: active.colorDeep } as React.CSSProperties) : undefined} aria-live="polite">
        {active ? (
          <>
            <div className="fm-name serif">{active.name}</div>
            <div className="fm-sanskrit">{active.iast} · {active.deity} <span className="sa-deva">{active.deva}</span></div>
            <div className="fm-governs">{active.governs}</div>
          </>
        ) : (
          <div className="fm-sanskrit">Nine zones, one guardian each.</div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="chips">
          {selected.map((code) => {
            const d = directions.find((x) => x.code === code);
            if (!d) return null;
            const style = { ["--pc" as string]: d.color, ["--pc-deep" as string]: d.colorDeep } as React.CSSProperties;
            return (
              <button key={code} type="button" className="chip" style={style} onClick={() => go(code)} aria-label={`Remove ${d.name} filter`}>
                {d.name} <span className="x" aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="fhint">{selected.length ? "Tap a petal to add or remove a zone" : "Tap a petal — you may hold more than one"}</div>

      {selected.length > 0 && (
        <button
          type="button"
          className="freset"
          onClick={() => router.push(toQuery({ ...baseParams, direction: undefined }), { scroll: false })}
        >
          Release all directions
        </button>
      )}
    </>
  );
}
