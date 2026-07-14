/**
 * MiniWheel — a small static SVG compass rose highlighting one direction.
 * Used on individual direction pages and the index grid. No interaction,
 * no motion (that's the big DirectionWheel's job).
 *
 * Direction positions match the big wheel: East 0°, South 90°, West 180°,
 * North -90° (standard screen coords).
 */

type Props = {
  /** direction code — "north" / "northeast" / ... / "center" */
  highlight: string;
  size?: number;
};

const NAMES: Record<string, { short: string; angle: number | null }> = {
  north:     { short: "N",  angle: -90 },
  northeast: { short: "NE", angle: -45 },
  east:      { short: "E",  angle: 0 },
  southeast: { short: "SE", angle: 45 },
  south:     { short: "S",  angle: 90 },
  southwest: { short: "SW", angle: 135 },
  west:      { short: "W",  angle: 180 },
  northwest: { short: "NW", angle: -135 },
  center:    { short: "◈",  angle: null },
};

export function MiniWheel({ highlight, size = 84 }: Props) {
  const R = 38;
  const CX = 42, CY = 42;
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
  };
  const isCenter = highlight === "center";

  return (
    <svg
      viewBox="0 0 84 84"
      width={size}
      height={size}
      aria-hidden="true"
      className="sa-miniwheel"
    >
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(232,184,73,0.22)" strokeWidth="0.6" />
      <circle cx={CX} cy={CY} r={R * 0.62} fill="none" stroke="rgba(232,184,73,0.15)" strokeWidth="0.5" />
      {Object.entries(NAMES).map(([code, meta]) => {
        if (meta.angle == null) return null;
        const outer = pt(meta.angle, R);
        const inner = pt(meta.angle, R * 0.62);
        const active = code === highlight;
        return (
          <g key={code}>
            <line
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke={active ? "var(--gold-lit)" : "rgba(232,184,73,0.18)"}
              strokeWidth={active ? 1.2 : 0.5}
            />
            <circle
              cx={outer.x} cy={outer.y}
              r={active ? 2.6 : 1.2}
              fill={active ? "var(--gold-lit)" : "rgba(232,184,73,0.5)"}
            />
          </g>
        );
      })}
      <circle
        cx={CX} cy={CY} r={isCenter ? 4.4 : 2.4}
        fill={isCenter ? "var(--gold-lit)" : "rgba(232,184,73,0.45)"}
      />
    </svg>
  );
}
